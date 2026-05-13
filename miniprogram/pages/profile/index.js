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

Page({
  ...ThemeMixin,

  data: {
    isLogin: false,
    userInfo: null,
    hasPermissionTag: false,
    adminRole: '',
    adminRoleName: '',
    theme: {}
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    const userStore = UserStore.getInstance()
    const isReallyLogin = userStore.isLogin
    const userInfo = userStore.userInfo
    const hasPermissionTag = userStore.hasPermissionTag()
    const adminRole = userStore.getAdminRole()
    const roleNames = {
      systemAdmin: '系统管理员',
      superAdmin: '超级管理员',
      academyManager: '书院管理人',
      approvalManager: '审批管理人',
      custom: '管理员'
    }

    this.setData({
      isLogin: isReallyLogin,
      userInfo: userInfo,
      hasPermissionTag: hasPermissionTag,
      adminRole: adminRole || '',
      adminRoleName: adminRole ? (roleNames[adminRole] || '管理员') : ''
    })

    if (!isReallyLogin) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
  },

  onEditProfile() {
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
    if (!userStore.hasPermissionTag()) {
      ErrorHandler.showError('无管理权限')
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
