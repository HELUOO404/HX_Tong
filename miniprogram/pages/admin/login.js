/**
 * @file 管理员登录页面
 * @description 管理员账号密码登录
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminStore = require('../../stores/adminStore')

Page({
  // 引入主题混入
  ...ThemeMixin,

  data: {
    username: '',
    password: '',
    isLoading: false
  },

  onLoad() {
    // 调用混入的 onLoad 来初始化主题
    ThemeMixin.onLoad.call(this)

    // 检查是否已登录
    const adminInfo = wx.getStorageSync('adminInfo')
    if (adminInfo) {
      wx.redirectTo({ url: '/pages/admin/index' })
    }
  },

  onShow() {
    // 调用混入的 onShow 来检查主题变化
    ThemeMixin.onShow.call(this)
  },

  /**
   * 输入用户名
   */
  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  /**
   * 输入密码
   */
  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  /**
   * 管理员登录
   */
  async onLogin() {
    const { username, password } = this.data

    if (!username.trim()) {
      ErrorHandler.showError('请输入用户名')
      return
    }

    if (!password.trim()) {
      ErrorHandler.showError('请输入密码')
      return
    }

    this.setData({ isLoading: true })
    ErrorHandler.showLoading('登录中...')

    try {
      // 使用聚合云函数 adminService
      const { result } = await wx.cloud.callFunction({
        name: 'adminService',
        data: {
          action: 'admin_login',
          params: { username, password }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '登录失败')
      }

      // 保存管理员信息（含token）
      wx.setStorageSync('adminInfo', {
        adminId: result.data.adminId,
        username: result.data.username,
        role: result.data.role,
        name: result.data.name,
        token: result.data.token,
        tokenExpiry: result.data.tokenExpiry,
        permissionTags: result.data.permissionTags || []
      })

      const adminStore = AdminStore.getInstance()
      adminStore._setAdminInfo(result.data)

      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('登录成功')

      setTimeout(() => {
        wx.redirectTo({ url: '/pages/admin/index' })
      }, 500)
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false })
      ErrorHandler.handle(error)
    }
  },

  /**
   * 返回用户端
   */
  onBackToUser() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
