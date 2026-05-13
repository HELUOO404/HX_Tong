const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()

Page({
  ...ThemeMixin,

  data: {
    页面标题: '数据库管理控制台',
    isLoading: false,
    result: null
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    this.checkSuperAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  checkSuperAdminAuth() {
    const adminInfo = wx.getStorageSync('adminInfo')
    if (!adminInfo || !adminInfo.token) {
      wx.redirectTo({ url: '/pages/admin/login' })
      return
    }
    if (adminInfo.tokenExpiry && Date.now() > adminInfo.tokenExpiry) {
      wx.removeStorageSync('adminInfo')
      wx.redirectTo({ url: '/pages/admin/login' })
      return
    }
    const permissionTags = adminInfo.permissionTags || []
    const AdminStore = require('../../stores/adminStore')
    const adminStore = AdminStore.getInstance()
    adminStore._setAdminInfo(adminInfo)
    if (!adminStore.hasPermission('canDatabaseManage')) {
      ErrorHandler.showError('仅系统管理员可访问此页面')
      wx.navigateBack()
    }
  },

  async initDatabase() {
    this.setData({ isLoading: true, result: null, resultDataStr: '' })
    ErrorHandler.showLoading('初始化中...')
    try {
      const data = await adminService.initDatabase()
      ErrorHandler.hideLoading()
      const resultDataStr = data ? JSON.stringify(data) : ''
      this.setData({ isLoading: false, result: { code: 200, data }, resultDataStr })
      ErrorHandler.showSuccess('数据库初始化成功')
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false, result: { code: 500, message: error.message } })
      ErrorHandler.showError(error.message || '初始化失败')
    }
  },

  async viewDatabase() {
    this.setData({ isLoading: true, result: null, resultDataStr: '' })
    try {
      const data = await adminService.viewDatabase()
      const resultDataStr = data ? JSON.stringify(data) : ''
      this.setData({ isLoading: false, result: { code: 200, data }, resultDataStr })
      console.log('[InitDB] 数据库内容:', data)
    } catch (error) {
      this.setData({ isLoading: false })
      ErrorHandler.handle(error)
    }
  },

  async fixSystemTags() {
    this.setData({ isLoading: true, result: null, resultDataStr: '' })
    ErrorHandler.showLoading('修复中...')
    try {
      const data = await adminService.fixSystemTags()
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false, result: { code: 200, data } })
      ErrorHandler.showSuccess(data?.message || '系统标签修复完成')
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false })
      ErrorHandler.showError(error.message || '修复失败')
    }
  },

  async removeOldTags() {
    this.setData({ isLoading: true, result: null })
    ErrorHandler.showLoading('清理中...')
    try {
      const data = await adminService.removeOldTags()
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false, result: { code: 200, data } })
      ErrorHandler.showSuccess(data?.message || '清理完成')
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false })
      ErrorHandler.showError(error.message || '清理失败')
    }
  },

  async fixApprovalRuleStatus() {
    this.setData({ isLoading: true, result: null })
    ErrorHandler.showLoading('修复中...')
    try {
      const data = await adminService.fixApprovalRuleStatus()
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false, result: { code: 200, data } })
      ErrorHandler.showSuccess(data?.message || `修复 ${data?.fixed || 0} 条规则`)
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false })
      ErrorHandler.showError(error.message || '修复失败')
    }
  }
})
