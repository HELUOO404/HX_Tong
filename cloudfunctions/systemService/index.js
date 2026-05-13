const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const permission = require('./utils/permission')
const roleDefaults = require('./utils/roleDefaults')

const handlers = {
  'system_initDatabase': require('./handlers/initDatabase'),
  'system_dbViewer': require('./handlers/dbViewer')
}

async function verifyAdminToken(token) {
  if (!token) return { valid: false, message: '未提供认证令牌' }
  try {
    const db = cloud.database()
    const { data: tokens } = await db.collection('admin_tokens')
      .where({ token, isValid: true }).limit(1).get()
    if (tokens.length === 0) return { valid: false, message: '无效的认证令牌' }
    const tokenRecord = tokens[0]
    if (tokenRecord.expiresAt && new Date() > new Date(tokenRecord.expiresAt)) {
      await db.collection('admin_tokens').doc(tokenRecord._id).update({ data: { isValid: false } })
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

    // 权限标签水合：从 permission_tags 集合查询完整权限
    if (permissionTags.length > 0) {
      const db = cloud.database()
      const tagIds = permissionTags.map(t => t.tagId).filter(Boolean)
      if (tagIds.length > 0) {
        try {
          const { data: fullTags } = await db.collection('permission_tags')
            .where({ tagId: db.command.in(tagIds) })
            .get()
          const tagMap = {}
          fullTags.forEach(t => { tagMap[t.tagId] = t })
          permissionTags = permissionTags.map(t => {
            const full = tagMap[t.tagId]
            if (full && full.permissions) {
              return { ...t, permissions: full.permissions, role: full.role || t.role }
            }
            return t
          })
        } catch (e) {
          console.warn('[systemService] 权限标签水合失败:', e)
        }
      }
    }

    // 角色兜底：如果权限标签为空或无效，使用角色默认权限
    const role = permission.getRoleFromTags(permissionTags) || admin.role
    if (!roleDefaults.getEffectivePermissions(permissionTags) && role) {
      const defaultTag = roleDefaults.getDefaultTagByRole(role)
      if (defaultTag) {
        console.warn(`[systemService] 管理员 ${admin._id} 权限标签为空，使用 ${role} 角色默认权限兜底`)
        permissionTags = [defaultTag]
      }
    }

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
    console.error('[systemService] verifyAdminToken 失败:', err)
    return { valid: false, message: '令牌验证失败' }
  }
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  console.log(`[systemService] 收到请求: action=${action}`)

  if (!action) {
    return { code: 400, message: '缺少action参数', data: null }
  }

  const handler = handlers[action]
  if (!handler) {
    return { code: 404, message: `未知的action: ${action}`, data: null }
  }

  try {
    const tokenResult = await verifyAdminToken(params._token)
    if (!tokenResult.valid) {
      return { code: 401, message: tokenResult.message, data: null }
    }

    const adminTags = tokenResult.admin.permissionTags || []
    if (!permission.hasPermission(adminTags, 'canDatabaseManage')) {
      return { code: 403, message: '权限不足，无法执行系统操作', data: null }
    }
    params._admin = tokenResult.admin

    const result = await handler(params, cloud)
    return result
  } catch (error) {
    console.error(`[systemService] ${action} 执行失败:`, error)
    return { code: 500, message: '服务器内部错误: ' + error.message, data: null }
  }
}
