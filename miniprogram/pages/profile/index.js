/**
 * @file 个人中心页面
 * @description 用户信息展示、管理后台入口、系统设置入口
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 2.1.0
 */

const UserStore = require('../../stores/userStore')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const { APP_NAME, APP_VERSION } = require('../../config/constants')

Page({
  ...ThemeMixin,

  data: {
    isLogin: false,
    userInfo: null,
    hasPermissionTag: false,
    hasAdminBackendAccess: false,
    adminRole: '',
    adminRoleName: '',
    appName: APP_NAME,
    appVersion: APP_VERSION,
    theme: {}
  },

  _unsubscribeUserStore: null,

  onLoad() {
    ThemeMixin.onLoad.call(this)

    const userStore = UserStore.getInstance()
    this._unsubscribeUserStore = userStore.subscribe((state) => {
      this.applyUserState(state)
    })
  },

  onUnload() {
    if (this._unsubscribeUserStore) {
      this._unsubscribeUserStore()
      this._unsubscribeUserStore = null
    }
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    this.syncUserState()
  },

  onPullDownRefresh() {
    this.syncUserState().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  applyUserState(state) {
    const userStore = UserStore.getInstance()
    const adminRole = userStore.getAdminRole()
    const roleNames = {
      systemAdmin: '系统管理员',
      superAdmin: '超级管理员',
      academyManager: '书院管理人',
      approvalManager: '审批管理人',
      scheduleViewer: '会议安排查看员',
      custom: '管理员'
    }

    this.setData({
      isLogin: state.isLogin,
      userInfo: state.userInfo,
      hasPermissionTag: userStore.hasPermissionTag(),
      hasAdminBackendAccess: userStore.hasAdminBackendAccess(),
      adminRole: adminRole || '',
      adminRoleName: adminRole ? (roleNames[adminRole] || '管理员') : ''
    })
  },

  async syncUserState() {
    const userStore = UserStore.getInstance()

    if (!userStore.isLogin) {
      this.applyUserState({ isLogin: false, userInfo: null })
      return
    }

    try {
      await userStore.refreshUserInfo()
    } catch (error) {
      console.warn('[profile] 刷新用户信息失败，使用本地缓存:', error)
    }

    this.applyUserState({
      isLogin: userStore.isLogin,
      userInfo: userStore.userInfo
    })
  },

  onEditProfile() {
    if (!this.data.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    wx.navigateTo({ url: '/pages/profile/edit' })
  },

  onChangeTheme() {
    wx.navigateTo({ url: '/pages/theme-settings/theme-settings' })
  },

  onSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  onMyBookings() {
    wx.navigateTo({ url: '/pages/booking/mylist' })
  },

  onCreditScore() {
    wx.navigateTo({ url: '/pages/credit/index' })
  },

  onAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  onLogin() {
    wx.redirectTo({ url: '/pages/login/login' })
  },

  onPreviewAvatar() {
    const avatarUrl = this.data.userInfo?.avatarUrl
    if (!avatarUrl) return
    wx.previewImage({
      urls: [avatarUrl],
      current: avatarUrl
    })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const userStore = UserStore.getInstance()
          userStore.logout()
          ErrorHandler.showSuccess('已退出登录')
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  },

  async onEnterAdminBackend() {
    const userStore = UserStore.getInstance()
    if (!userStore.hasAdminBackendAccess()) {
      ErrorHandler.showError('无管理后台权限')
      return
    }

    ErrorHandler.showLoading('进入管理后台...')

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'adminService',
        data: {
          action: 'admin_autoLogin',
          params: {}
        }
      })

      if (result.code === 200 && result.data) {
        wx.setStorageSync('adminInfo', {
          adminId: result.data.adminId,
          username: result.data.username,
          role: result.data.role,
          token: result.data.token,
          tokenExpiry: result.data.tokenExpiry,
          permissionTags: result.data.permissionTags
        })

        ErrorHandler.hideLoading()
        wx.navigateTo({ url: '/pages/admin/index' })
      } else {
        ErrorHandler.hideLoading()
        ErrorHandler.showError(result.message || '进入管理后台失败')
      }
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  }
})
