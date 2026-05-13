class AdminService {
  constructor() {
    this.db = wx.cloud.database()
  }

  static getInstance() {
    if (!AdminService._instance) {
      AdminService._instance = new AdminService()
    }
    return AdminService._instance
  }

  _injectToken(params = {}) {
    const adminInfo = wx.getStorageSync('adminInfo')
    if (adminInfo && adminInfo.token) {
      params._token = adminInfo.token
    }
    return params
  }

  _handle401(result) {
    if (result.code === 401) {
      wx.removeStorageSync('adminInfo')
      wx.redirectTo({ url: '/pages/admin/login' })
      throw new Error('登录已过期，请重新登录')
    }
  }

  async call(action, params = {}) {
    return this._callWithRetry('adminService', action, params, 2)
  }

  async callMeetingroom(action, params = {}) {
    return this._callWithRetry('meetingroomService', action, params, 2)
  }

  async callSystem(action, params = {}) {
    return this._callWithRetry('systemService', action, params, 2)
  }

  async _callWithRetry(serviceName, action, params = {}, retries = 2) {
    this._injectToken(params)
    try {
      const { result } = await wx.cloud.callFunction({
        name: serviceName,
        data: { action, params }
      })
      this._handle401(result)
      if (result.code !== 200) {
        throw new Error(result.message || '请求失败')
      }
      return result.data
    } catch (err) {
      const isTimeout = err.errMsg && (err.errMsg.includes('timeout') || err.errMsg.includes('超时'))
      const isNetworkError = err.errMsg && err.errMsg.includes('fail')
      if (retries > 0 && (isTimeout || isNetworkError)) {
        console.warn(`[AdminService] ${serviceName}.${action} 请求失败，剩余重试: ${retries}`, err.errMsg)
        await new Promise(resolve => setTimeout(resolve, 800))
        return this._callWithRetry(serviceName, action, params, retries - 1)
      }
      throw err
    }
  }

  async login(username, password) {
    const { result } = await wx.cloud.callFunction({
      name: 'adminService',
      data: { action: 'admin_login', params: { username, password } }
    })
    if (result.code !== 200) {
      throw new Error(result.message || '登录失败')
    }
    return result.data
  }

  async logout() {
    try {
      await this.call('admin_logout')
    } catch (e) {
      console.error('[AdminService] 登出通知服务端失败:', e)
    }
    wx.removeStorageSync('adminInfo')
  }

  async getDashboardData() {
    return this.call('admin_dashboard_getData')
  }

  async getUserList(params = {}) {
    return this.call('admin_users_getList', params)
  }

  async getFilterOptions() {
    return this.call('admin_users_getFilterOptions')
  }

  async updateUser(userId, data) {
    return this.call('admin_users_updateUser', { userId, ...data })
  }

  async deleteUser(userId) {
    return this.call('admin_users_delete', { userId })
  }

  async resetAvatar(userId) {
    return this.call('admin_users_resetAvatar', { userId })
  }

  async updateRole(params) {
    return this.call('admin_users_updateRole', params)
  }

  async updatePermission(params) {
    return this.call('admin_user_updatePermission', params)
  }

  async updateCredit(userId, scoreChange, reason) {
    return this.call('admin_users_updateCredit', { userId, scoreChange, reason })
  }

  async getUserBookings(userId, params = {}) {
    return this.call('admin_users_getBookings', { userId, ...params })
  }

  async getPublicResourceList() {
    return this.call('admin_publicResource_getList')
  }

  async createPublicResource(params) {
    return this.call('admin_publicResource_create', params)
  }

  async updatePublicResource(params) {
    return this.call('admin_publicResource_update', params)
  }

  async deletePublicResource(resourceId) {
    return this.call('admin_publicResource_delete', { resourceId })
  }

  async changePublicResourceStatus(resourceId, status) {
    return this.call('admin_publicResource_changeStatus', { resourceId, status })
  }

  async getApprovalRuleList(params = {}) {
    return this.call('admin_approvalRule_getList', params)
  }

  async createApprovalRule(params) {
    return this.call('admin_approvalRule_create', params)
  }

  async updateApprovalRule(params) {
    return this.call('admin_approvalRule_update', params)
  }

  async deleteApprovalRule(ruleId) {
    return this.call('admin_approvalRule_delete', { ruleId })
  }

  async toggleApprovalRule(ruleId, enabled) {
    return this.call('admin_approvalRule_toggle', { ruleId, enabled })
  }

  async getPermissionTagList() {
    return this.call('admin_permissionTag_getList')
  }

  async createPermissionTag(params) {
    return this.call('admin_permissionTag_create', params)
  }

  async updatePermissionTag(params) {
    return this.call('admin_permissionTag_update', params)
  }

  async deletePermissionTag(tagId) {
    return this.call('admin_permissionTag_delete', { tagId })
  }

  async updatePermissionTags(userId, permissionTags) {
    return this.call('admin_user_updatePermissionTags', { userId, permissionTags })
  }

  async getRoomList(params = {}) {
    return this.callMeetingroom('meetingroom_getList', params)
  }

  async getRoomDetail(roomId) {
    return this.callMeetingroom('meetingroom_getDetail', { roomId })
  }

  async createRoom(params) {
    return this.callMeetingroom('meetingroom_manage_create', params)
  }

  async updateRoom(roomId, data) {
    return this.callMeetingroom('meetingroom_manage_update', { roomId, ...data })
  }

  async deleteRoom(roomId) {
    return this.callMeetingroom('meetingroom_manage_delete', { roomId })
  }

  async getManageBookings(params = {}) {
    return this.callMeetingroom('meetingroom_manage_getBookings', params)
  }

  async approveBooking(bookingId, action, reason) {
    const params = { bookingId, action }
    if (reason) params.reason = reason
    return this.callMeetingroom('meetingroom_booking_approve', params)
  }

  async initDatabase() {
    return this.callSystem('system_initDatabase')
  }

  async viewDatabase() {
    return this.callSystem('system_dbViewer')
  }

  async fixSystemTags() {
    const res = await this.call('admin_permissionTag_fixSystemTags')
    wx.showToast({ title: res.message || '修复完成', icon: 'none' })
    return res
  }

  async removeOldTags() {
    return this.call('admin_permissionTag_removeOldTags')
  }

  async fixApprovalRuleStatus() {
    return this.call('admin_approvalRule_fixStatus')
  }
}

AdminService._instance = null

module.exports = AdminService
