const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const permission = require('./utils/permission')
const { getEffectivePermissions, getDefaultTagByRole } = require('./utils/roleDefaults')

const ADMIN_ACTIONS = [
  'meetingroom_booking_approve',
  'meetingroom_manage_create',
  'meetingroom_manage_update',
  'meetingroom_manage_delete',
  'meetingroom_manage_getBookings'
]

const PERMISSION_MAP = {
  'meetingroom_manage_create': 'canManageRooms',
  'meetingroom_manage_update': 'canManageRooms',
  'meetingroom_manage_delete': 'canDeleteRooms',
  'meetingroom_booking_approve': 'canApproveBookings',
  'meetingroom_manage_getBookings': 'canApproveBookings'
}

async function verifyAdminToken(token) {
  if (!token) return { valid: false, message: '未提供认证令牌' }
  try {
    const db = cloud.database()
    let tokens
    try {
      const result = await db.collection('admin_tokens')
        .where({ token, isValid: true })
        .limit(1)
        .get()
      tokens = result.data
    } catch (err) {
      if (err.message && err.message.includes('not exist')) {
        try { await db.createCollection('admin_tokens') } catch (e) { console.error('[meetingroomService] 创建admin_tokens失败:', e) }
        return { valid: false, message: '认证系统尚未初始化，请重新登录' }
      }
      throw err
    }
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
        console.error('[meetingroomService.verifyAdminToken] 查询权限标签失败:', e)
      }
    }

    if (!getEffectivePermissions(permissionTags)) {
      const adminRole = admin.role || 'systemAdmin'
      const defaultTag = getDefaultTagByRole(adminRole)
      if (defaultTag) {
        permissionTags = [{ ...defaultTag }]
        console.warn(`[meetingroomService.verifyAdminToken] 管理员 ${admin.username} 权限标签为空，使用角色 "${adminRole}" 默认权限兜底`)
      } else {
        return { valid: false, message: '无管理权限，请联系系统管理员分配权限标签', code: 403 }
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
      }
    }
  } catch (e) {
    return { valid: false, message: '令牌验证失败' }
  }
}

const handlers = {
  'meetingroom_booking_create': require('./handlers/booking/create'),
  'meetingroom_booking_cancel': require('./handlers/booking/cancel'),
  'meetingroom_booking_getMyList': require('./handlers/booking/list'),
  'meetingroom_booking_getDetail': require('./handlers/booking/detail'),
  'meetingroom_booking_viewDetail': require('./handlers/booking/viewDetail'),
  'meetingroom_booking_approve': require('./handlers/booking/approve'),
  'meetingroom_getList': require('./handlers/room/getList'),
  'meetingroom_getDetail': require('./handlers/room/getDetail'),
  'meetingroom_getTimeSlots': require('./handlers/room/getTimeSlots'),
  'meetingroom_getDateAvailability': require('./handlers/room/getDateAvailability'),
  'meetingroom_getPublicResources': require('./handlers/room/getPublicResources'),
  'meetingroom_manage_create': require('./handlers/manage/roomCreate'),
  'meetingroom_manage_update': require('./handlers/manage/roomUpdate'),
  'meetingroom_manage_delete': require('./handlers/manage/roomDelete'),
  'meetingroom_manage_getBookings': require('./handlers/manage/getBookings'),
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  if (!action) {
    return { code: 400, message: '缺少action参数', data: null }
  }

  const handler = handlers[action]
  if (!handler) {
    return { code: 404, message: `未知的action: ${action}`, data: null }
  }

  try {
    if (ADMIN_ACTIONS.includes(action)) {
      const tokenResult = await verifyAdminToken(params._token)
      if (!tokenResult.valid) {
        return { code: tokenResult.code || 401, message: tokenResult.message, data: null }
      }
      params._admin = tokenResult.admin

      const adminTags = (params._admin.permissionTags || []).filter(t => !t.permissions || Object.keys(t.permissions).length === 0)
      if (adminTags.length > 0) {
        try {
          const db = cloud.database()
          const { data: allTags } = await db.collection('permission_tags').get()
          const tagMap = {}
          allTags.forEach(t => {
            tagMap[t._id] = t
            if (t.tagId) tagMap[t.tagId] = t
          })
          params._admin.permissionTags = (params._admin.permissionTags || []).map(tag => {
            if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && tagMap[tag.tagId]) {
              return { ...tag, permissions: tagMap[tag.tagId].permissions || {} }
            }
            return tag
          })
        } catch (e) {
          console.error('[meetingroomService] 权限标签水合失败:', e)
        }
      }

      if (!getEffectivePermissions(params._admin.permissionTags)) {
        return { code: 403, message: '无有效管理权限，请联系系统管理员分配权限标签', data: null }
      }

      const requiredPerm = PERMISSION_MAP[action]
      if (requiredPerm) {
        const adminTags = params._admin.permissionTags || []
        if (!permission.hasPermission(adminTags, requiredPerm)) {
          return { code: 403, message: '权限不足，无法执行此操作', data: null }
        }
      }
    }
    return await handler(params, cloud)
  } catch (error) {
    console.error(`[meetingroomService] ${action} 执行失败:`, error)
    return { code: 500, message: '服务器内部错误', data: null }
  }
}
