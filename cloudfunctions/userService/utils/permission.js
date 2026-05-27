const ADMIN_ROLES = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']

const DEFAULT_PERMISSIONS = {
  canManageRooms: false,
  canDeleteRooms: false,
  canManagePublicResources: false,
  canApproveBookings: false,
  canViewAllUsers: false,
  canEditUsers: false,
  canManageApprovalRules: false,
  canManagePermissions: false,
  canManageSystem: false,
  canDatabaseManage: false,
  canAssignPermissionTags: false,
  canViewBookingDetails: false
}

function getRoleFromTags(permissionTags) {
  if (!permissionTags || !Array.isArray(permissionTags)) return null
  const priority = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']
  for (const role of priority) {
    if (permissionTags.some(tag => tag.role === role)) return role
  }
  return null
}

function getMergedPermissions(permissionTags) {
  if (!permissionTags || !Array.isArray(permissionTags) || permissionTags.length === 0) {
    return { ...DEFAULT_PERMISSIONS }
  }
  const merged = { ...DEFAULT_PERMISSIONS }
  for (const tag of permissionTags) {
    if (tag.permissions && typeof tag.permissions === 'object') {
      for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
        if (tag.permissions[key]) {
          merged[key] = true
        }
      }
    }
  }
  return merged
}

function hasPermission(permissionTags, requiredPermission) {
  const merged = getMergedPermissions(permissionTags)
  return !!merged[requiredPermission]
}

function isAdminRole(permissionTags) {
  const role = getRoleFromTags(permissionTags)
  return ADMIN_ROLES.includes(role)
}

function isSuperAdminOrAbove(permissionTags) {
  const role = getRoleFromTags(permissionTags)
  return role === 'systemAdmin' || role === 'superAdmin'
}

function isSystemAdmin(permissionTags) {
  return getRoleFromTags(permissionTags) === 'systemAdmin'
}

function isAdmin(role) {
  return ADMIN_ROLES.includes(role)
}

function isSuperAdmin(role) {
  return role === 'systemAdmin' || role === 'superAdmin'
}

module.exports = {
  ADMIN_ROLES,
  DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS: DEFAULT_PERMISSIONS,
  getRoleFromTags,
  getMergedPermissions,
  hasPermission,
  isAdminRole,
  isAdmin,
  isSuperAdmin,
  isSuperAdminOrAbove,
  isSystemAdmin
}
