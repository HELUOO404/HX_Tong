const DEFAULT_ROLE_TAGS = {
  systemAdmin: {
    tagId: 'system',
    tagName: '系统管理员',
    role: 'systemAdmin',
    permissions: {
      canManageRooms: true,
      canDeleteRooms: true,
      canManagePublicResources: true,
      canApproveBookings: true,
      canViewAllUsers: true,
      canEditUsers: true,
      canManageApprovalRules: true,
      canManagePermissions: true,
      canManageSystem: true,
      canDatabaseManage: true,
      canAssignPermissionTags: true
    }
  },
  superAdmin: {
    tagId: 'super',
    tagName: '超级管理员',
    role: 'superAdmin',
    permissions: {
      canManageRooms: true,
      canDeleteRooms: true,
      canManagePublicResources: true,
      canApproveBookings: true,
      canViewAllUsers: true,
      canEditUsers: true,
      canManageApprovalRules: true,
      canManagePermissions: true,
      canManageSystem: true,
      canDatabaseManage: false,
      canAssignPermissionTags: true
    }
  },
  academyManager: {
    tagId: 'academy',
    tagName: '书院管理人',
    role: 'academyManager',
    permissions: {
      canManageRooms: true,
      canDeleteRooms: true,
      canManagePublicResources: true,
      canApproveBookings: true,
      canViewAllUsers: true,
      canEditUsers: false,
      canManageApprovalRules: true,
      canManagePermissions: false,
      canManageSystem: false,
      canDatabaseManage: false,
      canAssignPermissionTags: false
    }
  },
  approvalManager: {
    tagId: 'approval',
    tagName: '审批管理人',
    role: 'approvalManager',
    permissions: {
      canManageRooms: false,
      canDeleteRooms: false,
      canManagePublicResources: false,
      canApproveBookings: true,
      canViewAllUsers: true,
      canEditUsers: false,
      canManageApprovalRules: false,
      canManagePermissions: false,
      canManageSystem: false,
      canDatabaseManage: false,
      canAssignPermissionTags: false
    }
  },
  scheduleViewer: {
    tagId: 'scheduleViewer',
    tagName: '会议安排查看员',
    role: 'scheduleViewer',
    permissions: {
      canManageRooms: false,
      canDeleteRooms: false,
      canManagePublicResources: false,
      canApproveBookings: false,
      canViewBookingDetails: true,
      canViewAllUsers: false,
      canEditUsers: false,
      canManageApprovalRules: false,
      canManagePermissions: false,
      canManageSystem: false,
      canDatabaseManage: false,
      canAssignPermissionTags: false
    }
  }
}

function getDefaultTagByRole(role) {
  if (!role || !DEFAULT_ROLE_TAGS[role]) {
    return null
  }
  return { ...DEFAULT_ROLE_TAGS[role] }
}

function getEffectivePermissions(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return false
  return tags.some(t => {
    if (!t.permissions) return false
    return Object.entries(t.permissions).some(([key, val]) => val === true && key !== 'canViewBookingDetails')
  })
}

module.exports = { DEFAULT_ROLE_TAGS, getDefaultTagByRole, getEffectivePermissions }
