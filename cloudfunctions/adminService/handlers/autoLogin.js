/**
 * @file 管理后台免密登录处理器
 * @description 有权限标签的用户通过openid免密进入管理后台
 */

const response = require('../utils/response')
const permission = require('../utils/permission')
const { getEffectivePermissions } = require('../utils/roleDefaults')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  try {
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.error(403, '用户不存在')
    }

    const user = users[0]
    let permissionTags = user.permissionTags || []
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
          if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && tagMap[tag.tagId]) {
            return { ...tag, permissions: tagMap[tag.tagId].permissions || {} }
          }
          return tag
        })
      } catch (e) {
        console.error('[autoLogin] 查询权限标签失败:', e)
      }
    }

    if (!getEffectivePermissions(permissionTags)) {
      return response.error(403, '无管理权限，请联系系统管理员分配权限标签')
    }

    let role = permission.getRoleFromTags(permissionTags)

    if (!role) {
      return response.error(403, '无管理权限')
    }

    const token = `${user._id}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000

    await db.collection('admin_tokens').add({
      data: {
        token,
        adminId: user._id,
        openid: OPENID,
        role: role,
        source: 'permissionTag',
        createdAt: db.serverDate(),
        expiresAt: new Date(tokenExpiry),
        isValid: true
      }
    })

    return response.success({
      adminId: user._id,
      username: user.realName || '管理员',
      role: role,
      token,
      tokenExpiry,
      permissionTags
    }, '免密登录成功')
  } catch (error) {
    console.error('[adminService.autoLogin] 免密登录失败:', error)
    return response.error(500, '免密登录失败')
  }
}
