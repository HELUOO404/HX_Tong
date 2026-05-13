/**
 * @file 系统设置页面
 * @description 包含个人信息编辑、更换主题、退出登录、关于、开发者模式入口
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 1.0.0
 */

const UserStore = require('../../stores/userStore')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    isLogin: false,
    theme: {}
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    const userStore = UserStore.getInstance()
    this.setData({
      isLogin: userStore.isLogin
    })
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile/edit' })
  },

  onChangeTheme() {
    wx.navigateTo({ url: '/pages/theme-settings/theme-settings' })
  },

  onAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
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

  onSystemAdmin() {
    wx.navigateTo({ url: '/pages/admin/login' })
  }
})
