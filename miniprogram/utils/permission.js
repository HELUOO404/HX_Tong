/**
 * @file 统一鉴权工具
 * @description 收口所有前端权限判断逻辑，提供大一统鉴权入口
 * @author 红芯通开发团队
 * @since 2026-05-10
 * @version 1.0.0
 */

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
  canAssignPermissionTags: false
}

const ADMIN_ROLES = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']

const ROLE_NAMES = {
  systemAdmin: '系统管理员',
  superAdmin: '超级管理员',
  academyManager: '书院管理人',
  approvalManager: '审批管理人'
}

const ALL_PERMISSION_KEYS = Object.keys(DEFAULT_PERMISSIONS)

const ALL_MENU_ITEMS = [
  { id: 'approvals', name: '预约审批', icon: '/assets/images/icons/approved.png', color: '#FAAD14', requiredPermission: 'canApproveBookings' },
  { id: 'rooms', name: '会议室管理', icon: '/assets/images/icons/room.png', color: '#1890FF', requiredPermission: 'canManageRooms' },
  { id: 'bookings', name: '预约记录', icon: '/assets/images/icons/booking.png', color: '#722ED1', requiredPermission: 'canApproveBookings' },
  { id: 'publicResources', name: '公共资源', icon: '/assets/images/icons/resource.png', color: '#13C2C2', requiredPermission: 'canManagePublicResources' },
  { id: 'approvalRules', name: '审批规则', icon: '/assets/images/icons/rule.png', color: '#EB2F96', requiredPermission: 'canManageApprovalRules' },
  { id: 'users', name: '用户管理', icon: '/assets/images/icons/user.png', color: '#52C41A', requiredPermission: 'canViewAllUsers' },
  { id: 'permissionTags', name: '权限标签', icon: '/assets/images/icons/permission.png', color: '#FA541C', requiredPermission: 'canManagePermissions' },
  { id: 'initdb', name: '数据库管理', icon: '/assets/images/icons/admin.png', color: '#999999', requiredPermission: 'canDatabaseManage' }
]

function getRoleFromTags(permissionTags) {
  if (!permissionTags || !Array.isArray(permissionTags)) return null
  const priority = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']
  for (const role of priority) {
    if (permissionTags.some(tag => tag.role === role)) return role
  }
  if (hasAnyPermissionInTags(permissionTags)) return 'custom'
  return null
}

function hasAnyPermissionInTags(permissionTags) {
  if (!permissionTags || !Array.isArray(permissionTags)) return false
  for (const tag of permissionTags) {
    if (tag.permissions && typeof tag.permissions === 'object') {
      for (const key of Object.keys(tag.permissions)) {
        if (tag.permissions[key]) return true
      }
    }
  }
  return false
}

function getMergedPermissions(adminInfo) {
  if (!adminInfo || !adminInfo.permissionTags || !Array.isArray(adminInfo.permissionTags) || adminInfo.permissionTags.length === 0) {
    return { ...DEFAULT_PERMISSIONS }
  }
  const merged = { ...DEFAULT_PERMISSIONS }
  for (const tag of adminInfo.permissionTags) {
    if (tag.permissions && typeof tag.permissions === 'object') {
      for (const key of ALL_PERMISSION_KEYS) {
        if (tag.permissions[key]) merged[key] = true
      }
    }
  }
  return merged
}

function checkPermission(adminInfo, permissionKey) {
  if (!adminInfo) return false
  const merged = getMergedPermissions(adminInfo)
  return !!merged[permissionKey]
}

function getAllPermissions(adminInfo) {
  return getMergedPermissions(adminInfo)
}

function filterMenuByPermission(adminInfo) {
  return filterMenuItems(ALL_MENU_ITEMS, adminInfo)
}

function filterMenuItems(menuItems, adminInfo) {
  if (!adminInfo) return []
  if (!adminInfo.permissionTags || adminInfo.permissionTags.length === 0) {
    const role = adminInfo.role
    if (role === 'systemAdmin') return ALL_MENU_ITEMS
    if (role === 'superAdmin') return ALL_MENU_ITEMS.filter(item => item.id !== 'initdb')
    if (role === 'academyManager') return ALL_MENU_ITEMS.filter(item => ['approvals', 'rooms', 'bookings', 'publicResources', 'approvalRules', 'users'].includes(item.id))
    if (role === 'approvalManager') return ALL_MENU_ITEMS.filter(item => ['approvals', 'bookings'].includes(item.id))
    return []
  }
  const merged = getMergedPermissions(adminInfo)
  return menuItems.filter(item => merged[item.requiredPermission])
}

function getPermissionMatrix(tagPermissions, allPermissionKeys) {
  const keys = allPermissionKeys || ALL_PERMISSION_KEYS
  return keys.map(key => ({
    key,
    tagValues: tagPermissions.map(tag => ({
      tagId: tag.tagId,
      tagName: tag.tagName || tag.name || '',
      hasPermission: tag.permissions && !!tag.permissions[key]
    }))
  }))
}

function getRoleName(role) {
  return ROLE_NAMES[role] || '管理员'
}

function hasAnyPermission(adminInfo) {
  if (!adminInfo) return false
  const merged = getMergedPermissions(adminInfo)
  return Object.values(merged).some(v => v === true)
}

function checkAdminAuth() {
  const adminInfo = wx.getStorageSync('adminInfo')
  if (!adminInfo || !adminInfo.token) {
    wx.redirectTo({ url: '/pages/admin/login' })
    return false
  }
  if (adminInfo.tokenExpiry && Date.now() > adminInfo.tokenExpiry) {
    wx.removeStorageSync('adminInfo')
    wx.redirectTo({ url: '/pages/admin/login' })
    return false
  }
  return true
}

module.exports = {
  DEFAULT_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  ADMIN_ROLES,
  ROLE_NAMES,
  ALL_MENU_ITEMS,
  getRoleFromTags,
  getMergedPermissions,
  checkPermission,
  getAllPermissions,
  filterMenuByPermission,
  filterMenuItems,
  getPermissionMatrix,
  getRoleName,
  hasAnyPermission,
  hasAnyPermissionInTags,
  checkAdminAuth
}
