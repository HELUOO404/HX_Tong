/**
 * 统一API调用服务
 * 封装所有云函数调用
 */

class ApiService {
  constructor() {
    this.cloud = wx.cloud
  }
  
  static getInstance() {
    if (!ApiService._instance) {
      ApiService._instance = new ApiService()
    }
    return ApiService._instance
  }
  
  /**
   * 统一调用方法
   * @param {string} functionName 云函数名
   * @param {string} action API动作
   * @param {object} params 业务参数
   */
  async call(functionName, action, params = {}) {
    try {
      if (this._isAdminAction(action)) {
        const adminInfo = wx.getStorageSync('adminInfo')
        if (adminInfo && adminInfo.token) {
          params._token = adminInfo.token
        }
      }

      const { result } = await this.cloud.callFunction({
        name: functionName,
        data: { action, params }
      })
      
      if (result.code === 401) {
        wx.removeStorageSync('adminInfo')
        wx.redirectTo({ url: '/pages/admin/login' })
        throw new Error('登录已过期，请重新登录')
      }
      
      if (result.code !== 200) {
        throw new Error(result.message || '请求失败')
      }
      
      return result.data
    } catch (error) {
      console.error(`[ApiService] ${functionName}.${action} 调用失败:`, {
        errCode: error.errCode,
        errMsg: error.errMsg,
        message: error.message,
        fullError: error
      })
      throw error
    }
  }

  _isAdminAction(action) {
    return action.startsWith('admin_') || action.startsWith('meetingroom_manage_') || action.startsWith('system_') || action === 'meetingroom_booking_approve'
  }
  
  // 会议室相关API
  meetingroom = {
    booking: {
      create: (params) => this.call('meetingroomService', 'meetingroom_booking_create', params),
      cancel: (params) => this.call('meetingroomService', 'meetingroom_booking_cancel', params),
      getMyList: (params) => this.call('meetingroomService', 'meetingroom_booking_getMyList', params),
      getDetail: (params) => this.call('meetingroomService', 'meetingroom_booking_getDetail', params),
      approve: (params) => this.call('meetingroomService', 'meetingroom_booking_approve', params)
    },
    
    getList: (params) => this.call('meetingroomService', 'meetingroom_getList', params),
    getDetail: (params) => this.call('meetingroomService', 'meetingroom_getDetail', params),
    getTimeSlots: (params) => this.call('meetingroomService', 'meetingroom_getTimeSlots', params),
    
    manage: {
      create: (params) => this.call('meetingroomService', 'meetingroom_manage_create', params),
      update: (params) => this.call('meetingroomService', 'meetingroom_manage_update', params),
      delete: (params) => this.call('meetingroomService', 'meetingroom_manage_delete', params),
      getBookings: (params) => this.call('meetingroomService', 'meetingroom_manage_getBookings', params)
    }
  }
  
  // 用户相关API
  user = {
    login: () => this.call('userService', 'user_login'),
    getInfo: () => this.call('userService', 'user_getInfo'),
    updateInfo: (params) => this.call('userService', 'user_updateInfo', params),
    completeProfile: (params) => this.call('userService', 'user_completeProfile', params),
    
    credit: {
      getScore: () => this.call('userService', 'user_credit_getScore'),
      getRecords: (params) => this.call('userService', 'user_credit_getRecords', params)
    },
    
    // 退出登录（用于完善信息页面选择跳过）
    logout: () => {
      return new Promise((resolve) => {
        wx.removeStorageSync('userInfo')
        wx.removeStorageSync('token')
        resolve({ success: true })
      })
    }
  }
  
  // 管理员相关API
  admin = {
    login: (params) => this.call('adminService', 'admin_login', params),
    dashboard: {
      getStats: () => this.call('adminService', 'admin_dashboard_getData')
    },
    user: {
      getList: (params) => this.call('adminService', 'admin_users_getList', params),
      updateUser: (userId, data) => this.call('adminService', 'admin_users_updateUser', { userId, ...data }),
      deleteUser: (userId) => this.call('adminService', 'admin_users_delete', { userId }),
      resetAvatar: (userId) => this.call('adminService', 'admin_users_resetAvatar', { userId }),
      updateRole: (params) => this.call('adminService', 'admin_users_updateRole', params)
    },
    publicResource: {
      getList: () => this.call('adminService', 'admin_publicResource_getList'),
      create: (params) => this.call('adminService', 'admin_publicResource_create', params),
      update: (params) => this.call('adminService', 'admin_publicResource_update', params),
      delete: (resourceId) => this.call('adminService', 'admin_publicResource_delete', { resourceId }),
      changeStatus: (resourceId, status) => this.call('adminService', 'admin_publicResource_changeStatus', { resourceId, status })
    },
    approvalRule: {
      getList: (params) => this.call('adminService', 'admin_approvalRule_getList', params),
      create: (params) => this.call('adminService', 'admin_approvalRule_create', params),
      update: (params) => this.call('adminService', 'admin_approvalRule_update', params),
      delete: (ruleId) => this.call('adminService', 'admin_approvalRule_delete', { ruleId }),
      toggle: (ruleId, enabled) => this.call('adminService', 'admin_approvalRule_toggle', { ruleId, enabled })
    },
    permissionTag: {
      getList: () => this.call('adminService', 'admin_permissionTag_getList'),
      create: (params) => this.call('adminService', 'admin_permissionTag_create', params),
      update: (params) => this.call('adminService', 'admin_permissionTag_update', params),
      delete: (tagId) => this.call('adminService', 'admin_permissionTag_delete', { tagId })
    }
  }
}

ApiService._instance = null

module.exports = ApiService
