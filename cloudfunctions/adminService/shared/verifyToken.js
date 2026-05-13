const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const permission = require('../utils/permission')
const { getDefaultTagByRole, getEffectivePermissions } = require('../utils/roleDefaults')

async function ensureAdminTokensCollection() {
  try {
    await db.collection('admin_tokens').limit(1).get()
  } catch (err) {
    if (err.message && err.message.includes('not exist')) {
      try {
        await db.createCollection('admin_tokens')
        console.log('[verifyToken] 创建admin_tokens集合成功')
      } catch (createErr) {
        console.error('[verifyToken] 创建admin_tokens集合失败:', createErr)
      }
    }
  }
}

async function verifyToken(token) {
  if (!token) {
    return { valid: false, message: '未提供认证令牌' }
  }

  try {
    let tokens
    try {
      const result = await db.collection('admin_tokens')
        .where({
          token,
          isValid: true
        })
        .limit(1)
        .get()
      tokens = result.data
    } catch (err) {
      if (err.message && err.message.includes('not exist')) {
        await ensureAdminTokensCollection()
        return { valid: false, message: '认证系统尚未初始化，请重新登录' }
      }
      throw err
    }

    if (tokens.length === 0) {
      return { valid: false, message: '无效的认证令牌' }
    }

    const tokenRecord = tokens[0]

    if (tokenRecord.expiresAt && new Date() > new Date(tokenRecord.expiresAt)) {
      await db.collection('admin_tokens').doc(tokenRecord._id).update({
        data: { isValid: false }
      })
      return { valid: false, message: '认证令牌已过期' }
    }

    let admin = null
    try {
      const { data } = await db.collection('admins').doc(tokenRecord.adminId).get()
      admin = data
    } catch (e) {
      // admins集合找不到，尝试users集合
    }

    if (!admin) {
      try {
        const { data } = await db.collection('users').doc(tokenRecord.adminId).get()
        admin = data
      } catch (e) {
        return { valid: false, message: '管理员账号不可用' }
      }
    }

    if (admin.status && admin.status !== 'active') {
      return { valid: false, message: '管理员账号不可用' }
    }

    let permissionTags = admin.permissionTags || []
    const tagsNeedingPermissions = permissionTags.filter(t => !t.permissions || Object.keys(t.permissions).length === 0)
    if (tagsNeedingPermissions.length > 0) {
      try {
        const allTagIds = tagsNeedingPermissions.map(t => t.tagId || t._id).filter(Boolean)
        if (allTagIds.length > 0) {
          const { data: allTags } = await db.collection('permission_tags')
            .where(db.command.or([
              { tagId: db.command.in(allTagIds) },
              { _id: db.command.in(allTagIds) }
            ]))
            .get()
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
        }
      } catch (e) {
        console.error('[verifyToken] 查询权限标签失败:', e)
      }
    }

    if (!getEffectivePermissions(permissionTags)) {
      const adminRole = admin.role || 'systemAdmin'
      const defaultTag = getDefaultTagByRole(adminRole)
      if (defaultTag) {
        const existingTagIds = new Set(permissionTags.map(t => t.tagId || t._id))
        const defaultTagKey = defaultTag.tagId || defaultTag._id
        if (!existingTagIds.has(defaultTagKey)) {
          permissionTags.push({ ...defaultTag })
        }
        console.warn(`[verifyToken] 管理员 ${admin.username} 权限标签为空，使用角色 "${adminRole}" 默认权限`)
      }
    }

    const role = permission.getRoleFromTags(permissionTags) || admin.role

    return {
      valid: true,
      admin: {
        _id: admin._id,
        username: admin.username || admin.realName || '',
        role: role,
        name: admin.name || admin.realName || '',
        permissionTags: permissionTags
      },
      tokenRecord
    }
  } catch (err) {
    console.error('[verifyToken] 验证失败:', err)
    return { valid: false, message: '令牌验证失败' }
  }
}

async function invalidateToken(token) {
  try {
    const { data: tokens } = await db.collection('admin_tokens')
      .where({ token, isValid: true })
      .limit(1)
      .get()

    if (tokens.length > 0) {
      await db.collection('admin_tokens').doc(tokens[0]._id).update({
        data: { isValid: false }
      })
    }
  } catch (err) {
    console.error('[invalidateToken] 失败:', err)
  }
}

module.exports = { verifyToken, invalidateToken }
