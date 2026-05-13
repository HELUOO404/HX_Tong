/**
 * @file 管理员登录处理器
 * @description 管理员账号密码登录验证
 */

const { success, error } = require('../utils/response')
const { validateRequired } = require('../utils/validator')
const { getEffectivePermissions, getDefaultTagByRole } = require('../utils/roleDefaults')
const permission = require('../utils/permission')
const bcrypt = require('bcryptjs')

async function login(params, cloud) {
  const { username, password } = params
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  const validation = validateRequired(params, ['username', 'password'])
  if (!validation.valid) {
    return error(400, validation.message)
  }

  try {
    let adminsCollection
    try {
      adminsCollection = db.collection('admins')
      await adminsCollection.limit(1).get()
    } catch (collError) {
      console.error('[adminService.login] admins 集合不存在:', collError.message)
      return error(500, '管理员集合不存在，请先初始化数据库')
    }

    const { data } = await adminsCollection
      .where({ username })
      .get()

    if (data.length === 0) {
      return error(401, '用户名或密码错误')
    }

    const admin = data[0]

    if (admin.status && admin.status !== 'active') {
      return error(401, '账号已被禁用')
    }

    const storedPassword = admin.passwordHash || admin.password
    let passwordMatch = false

    if (admin.passwordHash) {
      passwordMatch = await bcrypt.compare(password, storedPassword)
    } else {
      passwordMatch = password === storedPassword
      if (passwordMatch) {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)
        await adminsCollection.doc(admin._id).update({
          data: { passwordHash: hash, updatedAt: db.serverDate() }
        })
      }
    }

    if (!passwordMatch) {
      return error(401, '用户名或密码错误')
    }

    console.log('[adminService.login] 登录成功:', admin.username)

    const updateData = {
      lastLoginTime: db.serverDate(),
      updatedAt: db.serverDate()
    }
    if (!admin._openid) {
      updateData._openid = OPENID
    }

    await adminsCollection.doc(admin._id).update({ data: updateData })

    const token = `${admin._id}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000

    try {
      await db.collection('admin_tokens').add({
        data: {
          adminId: admin._id,
          token,
          openid: OPENID,
          createdAt: db.serverDate(),
          expiresAt: new Date(tokenExpiry),
          isValid: true
        }
      })
    } catch (tokenErr) {
      if (tokenErr.message && tokenErr.message.includes('not exist')) {
        try {
          await db.createCollection('admin_tokens')
          await db.collection('admin_tokens').add({
            data: {
              adminId: admin._id,
              token,
              openid: OPENID,
              createdAt: db.serverDate(),
              expiresAt: new Date(tokenExpiry),
              isValid: true
            }
          })
        } catch (createErr) {
          console.error('[adminService.login] 创建admin_tokens集合并写入token失败:', createErr)
          return error(500, '登录服务异常，请先初始化数据库')
        }
      } else {
        throw tokenErr
      }
    }

    try {
      const { data: expiredTokens } = await db.collection('admin_tokens')
        .where({ isValid: true, expiresAt: db.command.lt(new Date()) })
        .limit(100)
        .get()
      for (const t of expiredTokens) {
        await db.collection('admin_tokens').doc(t._id).update({ data: { isValid: false } })
      }
    } catch (cleanupErr) {
      console.error('[adminService.login] 清理过期token失败:', cleanupErr)
    }

    const adminRole = admin.role || 'systemAdmin'

    let permissionTags = admin.permissionTags || []
    const tagsNeedingPermissions = permissionTags.filter(t => !t.permissions || Object.keys(t.permissions).length === 0)
    if (tagsNeedingPermissions.length > 0) {
      try {
        const { data: allTags } = await db.collection('permission_tags').get()
        const tagMap = {}
        allTags.forEach(t => {
          tagMap[t._id] = t
          if (t.tagId) tagMap[t.tagId] = t
        })
        permissionTags = permissionTags.map(tag => {
          if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && (tagMap[tag.tagId] || tagMap[tag._id])) {
            const fullTag = tagMap[tag.tagId] || tagMap[tag._id]
            return { ...tag, permissions: fullTag.permissions || {}, tagName: fullTag.tagName || fullTag.name, role: fullTag.role }
          }
          return tag
        })
      } catch (e) {
        console.error('[adminService.login] 查询权限标签失败:', e)
      }
    }

    if (!getEffectivePermissions(permissionTags)) {
      const defaultTag = getDefaultTagByRole(adminRole)
      if (defaultTag) {
        const existingTagIds = new Set(permissionTags.map(t => t.tagId || t._id))
        const defaultTagKey = defaultTag.tagId || defaultTag._id
        if (!existingTagIds.has(defaultTagKey)) {
          permissionTags.push({ ...defaultTag })
        }
        console.warn(`[adminService.login] 管理员 ${admin.username}(${adminRole}) 权限标签无效，使用角色默认权限`)
      } else {
        return error(403, '该管理员账号未分配任何权限标签，请联系系统管理员')
      }
    }

    const resolvedRole = permission.getRoleFromTags(permissionTags) || adminRole
    if (resolvedRole && resolvedRole !== admin.role) {
      try {
        await adminsCollection.doc(admin._id).update({
          data: { role: resolvedRole }
        })
        console.log(`[adminService.login] 已修正管理员 ${admin.username} 的角色: ${admin.role} → ${resolvedRole}`)
      } catch (e) {
        console.warn('[adminService.login] 修正管理员角色失败:', e)
      }
    }

    if (JSON.stringify(admin.permissionTags) !== JSON.stringify(permissionTags)) {
      try {
        await adminsCollection.doc(admin._id).update({
          data: { permissionTags, updatedAt: db.serverDate() }
        })
        console.log(`[adminService.login] 已修复管理员 ${admin.username} 的权限标签结构`)
      } catch (fixErr) {
        console.error('[adminService.login] 修复权限标签结构失败:', fixErr)
      }
    }

    return success({
      adminId: admin._id,
      username: admin.username,
      role: adminRole,
      name: admin.name,
      token,
      tokenExpiry,
      permissionTags
    }, '登录成功')
  } catch (err) {
    console.error('[adminService.login] 登录失败:', err)
    return error(500, '登录失败: ' + err.message)
  }
}

module.exports = login
