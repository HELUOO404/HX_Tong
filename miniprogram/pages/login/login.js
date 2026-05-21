/**
 * @file 登录页面
 * @description 用户微信登录入口
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 2.0.0
 */

const UserStore = require('../../stores/userStore')
const { ErrorHandler } = require('../../utils/errorHandler')
const { APP_NAME } = require('../../config/constants')

Page({
  data: {
    isLoading: false,
    appName: APP_NAME
  },

  onShow() {
    const userStore = UserStore.getInstance()
    if (userStore.isLogin) {
      const userInfo = userStore.userInfo
      if (!userInfo || userInfo.profileCompleted !== true) {
        wx.redirectTo({ url: '/pages/profile/complete' })
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    }
  },

  async handleLogin() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })
    ErrorHandler.showLoading('登录中...')

    try {
      const userStore = UserStore.getInstance()
      const userInfo = await userStore.login()

      ErrorHandler.hideLoading()

      if (!userInfo || userInfo.profileCompleted !== true) {
        wx.redirectTo({
          url: '/pages/profile/complete'
        })
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isLoading: false })

      ErrorHandler.handle(error, {
        fallback: () => {
          wx.showModal({
            title: '登录失败',
            content: error.message || '请稍后重试',
            showCancel: false
          })
        }
      })
    }
  },

  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: `欢迎使用${APP_NAME}。本应用为书院会议室预约管理平台，用户需遵守书院相关规定，合理使用预约功能。违规预约（如预约后不使用、恶意占用资源等）将扣除信誉分，情节严重者将被限制预约权限。`,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: `${APP_NAME}重视您的隐私保护。我们仅收集必要的用户信息（昵称为必填，头像与备注为选填）用于预约服务。您的信息将安全存储于微信云开发数据库中，不会向第三方披露。如需删除个人信息，请联系管理员。`,
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})