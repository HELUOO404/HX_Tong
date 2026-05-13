/**
 * @file 信息完善页面
 * @description 首次登录用户完善个人信息
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 3.0.0
 */

const UserStore = require('../../stores/userStore')
const UserService = require('../../services/userService')
const { ErrorHandler } = require('../../utils/errorHandler')
const { ACADEMIES, IC_CLASSES } = require('../../config/constants')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    avatarUrl: '',
    realName: '',
    studentId: '',
    className: '',
    academy: '',
    phone: '',
    academies: ACADEMIES,
    icClasses: IC_CLASSES,
    needClassSelect: false,
    showClassInput: true,
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
      return
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

  onRealNameInput(e) {
    this.setData({ realName: e.detail.value })
  },

  onStudentIdInput(e) {
    this.setData({ studentId: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onSelectAcademy(e) {
    const { value } = e.detail
    const academy = this.data.academies[value]
    const isIC = academy === '集成电路学院'
    this.setData({
      academy: academy,
      needClassSelect: isIC,
      showClassInput: !isIC,
      className: ''
    })
  },

  onSelectClass(e) {
    const { value } = e.detail
    const className = this.data.icClasses[value]
    this.setData({ className: className })
  },

  onClassNameInput(e) {
    this.setData({ className: e.detail.value })
  },

  onSubmit() {
    if (this.data.isSubmitting) return

    if (!this.data.realName.trim()) {
      ErrorHandler.showError('请填写真实姓名')
      return
    }

    if (!this.data.academy) {
      ErrorHandler.showError('请选择学院')
      return
    }

    if (!this.data.className) {
      ErrorHandler.showError('请填写班级')
      return
    }

    if (!this.data.studentId.trim()) {
      ErrorHandler.showError('请填写学号')
      return
    }

    if (!/^\d{9}$/.test(this.data.studentId.trim())) {
      ErrorHandler.showError('学号必须为9位数字')
      return
    }

    if (!this.data.phone.trim()) {
      ErrorHandler.showError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.phone.trim())) {
      ErrorHandler.showError('请输入正确的手机号格式')
      return
    }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('保存中...')

    const userStore = UserStore.getInstance()
    const userService = UserService.getInstance()
    userService.completeProfile({
      realName: this.data.realName,
      studentId: this.data.studentId,
      className: this.data.className,
      academy: this.data.academy,
      phone: this.data.phone,
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
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
