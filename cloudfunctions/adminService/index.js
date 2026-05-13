const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const { verifyToken } = require('./shared/verifyToken')
const permission = require('./utils/permission')
const { getEffectivePermissions } = require('./utils/roleDefaults')

const PUBLIC_ACTIONS = ['admin_login', 'admin_autoLogin']

const PERMISSION_REQUIRED = {
  'admin_users_getFilterOptions': 'canViewAllUsers',
  'admin_users_getList': 'canViewAllUsers',
  'admin_users_updateUser': 'canEditUsers',
  'admin_users_delete': 'canEditUsers',
  'admin_users_resetAvatar': 'canEditUsers',
  'admin_users_getBookings': 'canViewAllUsers',
  'admin_users_updateCredit': 'canEditUsers',
  'admin_users_updateRole': 'canManagePermissions',
  'admin_user_updatePermission': 'canManagePermissions',
  'admin_user_updatePermissionTags': 'canAssignPermissionTags',
  'admin_permissionTag_getList': 'canManagePermissions',
  'admin_permissionTag_create': 'canManagePermissions',
  'admin_permissionTag_update': 'canManagePermissions',
  'admin_permissionTag_delete': 'canManagePermissions',
  'admin_permissionTag_initSystem': 'canManagePermissions',
  'admin_permissionTag_fixSystemTags': 'canManagePermissions',
  'admin_permissionTag_removeOldTags': 'canManagePermissions',
  'admin_approvalRule_fixStatus': 'canManageApprovalRules',
  'admin_fixOpenid': 'canDatabaseManage',
  'admin_publicResource_getList': 'canManagePublicResources',
  'admin_publicResource_create': 'canManagePublicResources',
  'admin_publicResource_update': 'canManagePublicResources',
  'admin_publicResource_delete': 'canManagePublicResources',
  'admin_publicResource_changeStatus': 'canManagePublicResources',
  'admin_approvalRule_getList': 'canManageApprovalRules',
  'admin_approvalRule_create': 'canManageApprovalRules',
  'admin_approvalRule_update': 'canManageApprovalRules',
  'admin_approvalRule_delete': 'canManageApprovalRules',
  'admin_approvalRule_toggle': 'canManageApprovalRules'
}

const handlers = {
  'admin_login': require('./handlers/login'),
  'admin_autoLogin': require('./handlers/autoLogin'),
  'admin_logout': require('./handlers/logout'),
  'admin_dashboard_getData': require('./handlers/dashboard').getDashboard,
  'admin_users_getFilterOptions': require('./handlers/users').getFilterOptions,
  'admin_users_getList': require('./handlers/users').getList,
  'admin_users_updateUser': require('./handlers/users').updateUser,
  'admin_users_delete': require('./handlers/users').deleteUser,
  'admin_users_resetAvatar': require('./handlers/users').resetAvatar,
  'admin_users_updateRole': require('./handlers/users').updateRole,
  'admin_user_updatePermission': require('./handlers/users').updatePermission,
  'admin_user_updatePermissionTags': require('./handlers/users').updatePermissionTags,
  'admin_users_getBookings': require('./handlers/users').getUserBookings,
  'admin_users_updateCredit': require('./handlers/users').updateCredit,
  'admin_publicResource_getList': require('./handlers/publicResource').getList,
  'admin_publicResource_create': require('./handlers/publicResource').create,
  'admin_publicResource_update': require('./handlers/publicResource').update,
  'admin_publicResource_delete': require('./handlers/publicResource').remove,
  'admin_publicResource_changeStatus': require('./handlers/publicResource').changeStatus,
  'admin_approvalRule_getList': require('./handlers/approvalRule').getList,
  'admin_approvalRule_create': require('./handlers/approvalRule').create,
  'admin_approvalRule_update': require('./handlers/approvalRule').update,
  'admin_approvalRule_delete': require('./handlers/approvalRule').remove,
  'admin_approvalRule_toggle': require('./handlers/approvalRule').toggle,
  'admin_permissionTag_getList': require('./handlers/permissionTag').getList,
  'admin_permissionTag_create': require('./handlers/permissionTag').create,
  'admin_permissionTag_update': require('./handlers/permissionTag').update,
  'admin_permissionTag_delete': require('./handlers/permissionTag').remove,
  'admin_permissionTag_initSystem': require('./handlers/permissionTag').initSystem,
  'admin_permissionTag_fixSystemTags': require('./handlers/permissionTag').fixSystemTags,
  'admin_permissionTag_removeOldTags': require('./handlers/permissionTag').removeOldTags,
  'admin_approvalRule_fixStatus': require('./handlers/approvalRule').fixStatus,
  'admin_fixOpenid': require('./handlers/fixAdminOpenid')
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  console.log(`[adminService] 收到请求: ${action}`)

  if (!action) {
    return { code: 400, message: '缺少 action 参数', data: null }
  }

  const handler = handlers[action]
  if (!handler) {
    return { code: 404, message: `未知的 action: ${action}`, data: null }
  }

  try {
    if (!PUBLIC_ACTIONS.includes(action)) {
      const tokenResult = await verifyToken(params._token)
      if (!tokenResult.valid) {
        return { code: 401, message: tokenResult.message, data: null }
      }
      params._admin = tokenResult.admin

      const adminTags = params._admin.permissionTags || []
      const needsHydration = adminTags.filter(t => !t.permissions || Object.keys(t.permissions).length === 0)
      if (needsHydration.length > 0) {
        try {
          const db = cloud.database()
          const { data: allTags } = await db.collection('permission_tags').get()
          const tagMap = {}
          allTags.forEach(t => {
            tagMap[t._id] = t
            if (t.tagId) tagMap[t.tagId] = t
          })
          params._admin.permissionTags = adminTags.map(tag => {
            if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && tagMap[tag.tagId]) {
              return { ...tag, permissions: tagMap[tag.tagId].permissions || {} }
            }
            return tag
          })
        } catch (e) {
          console.error('[adminService] 权限标签水合失败:', e)
        }
      }

      if (!getEffectivePermissions(params._admin.permissionTags)) {
        return { code: 403, message: '无有效管理权限，请联系系统管理员分配权限标签', data: null }
      }

      const requiredPerm = PERMISSION_REQUIRED[action]
      if (requiredPerm) {
        const checkTags = params._admin.permissionTags || []
        if (!permission.hasPermission(checkTags, requiredPerm)) {
          return { code: 403, message: '权限不足，无法执行此操作', data: null }
        }
      }
    }

    const result = await handler(params, cloud)
    return result
  } catch (error) {
    console.error(`[adminService] ${action} 执行失败:`, error)
    return { code: 500, message: '服务器内部错误: ' + error.message, data: null }
  }
}
