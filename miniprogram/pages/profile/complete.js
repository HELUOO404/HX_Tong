/**
 * @file 信息完善页面
 * @description 首次登录用户完善个人信息
 */

const UserStore = require('../../stores/userStore')
const UserService = require('../../services/userService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    avatarUrl: '',
    nickname: '',
    remark: '',
    isSubmitting: false
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)

    const userStore = UserStore.getInstance()
    if (!userStore.isRawLogin) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    if (userStore.isProfileCompleted) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  async onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl
    wx.showLoading({ title: '上传中...' })
    try {
      const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempPath
      })
      this.setData({ avatarUrl: uploadRes.fileID })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '头像上传失败', icon: 'none' })
    }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onSubmit() {
    if (this.data.isSubmitting) return

    const nickname = (this.data.nickname || '').trim()
    const remark = (this.data.remark || '').trim()

    if (!nickname) {
      ErrorHandler.showError('请填写昵称')
      return
    }
    if (nickname.length > 20) {
      ErrorHandler.showError('昵称不能超过20个字符')
      return
    }
    if (remark.length > 200) {
      ErrorHandler.showError('备注不能超过200个字符')
      return
    }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('保存中...')

    const userStore = UserStore.getInstance()
    const userService = UserService.getInstance()
    userService.completeProfile({
      nickname,
      remark,
      avatarUrl: this.data.avatarUrl
    }).then((updatedInfo) => {
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('保存成功')
      userStore.completeLogin(updatedInfo)
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    }).catch((error) => {
      ErrorHandler.hideLoading()
      this.setData({ isSubmitting: false })
      ErrorHandler.handle(error)
    })
  },

  onRefuse() {
    wx.showModal({
      title: '提示',
      content: '拒绝填写信息将退出登录并取消注册',
      success: async (res) => {
        if (res.confirm) {
          ErrorHandler.showLoading('处理中...')
          try {
            const userService = UserService.getInstance()
            await userService.cancelRegistration()
            ErrorHandler.hideLoading()
            ErrorHandler.showSuccess('已取消注册')
          } catch (err) {
            ErrorHandler.hideLoading()
            console.error('[CompleteProfile] 取消注册失败:', err)
            ErrorHandler.showError('取消注册失败，请重试')
            return
          }
          const userStore = UserStore.getInstance()
          userStore.logout()
          wx.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }
})
