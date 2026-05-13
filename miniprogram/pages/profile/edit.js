/**
 * @file 个人信息编辑页面
 * @description 用户编辑头像和手机号，其余信息只读展示
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 2.0.0
 */

const UserStore = require('../../stores/userStore')
const UserService = require('../../services/userService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    avatarUrl: '',
    phone: '',
    realName: '',
    academy: '',
    className: '',
    studentId: '',
    isSubmitting: false,
    theme: {}
  },

  _unsubscribeUserStore: null,

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    this.loadUserInfo()
  },

  onUnload() {
    if (this._unsubscribeUserStore) {
      this._unsubscribeUserStore()
    }
  },

  loadUserInfo() {
    const userStore = UserStore.getInstance()
    const userInfo = userStore.userInfo

    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '',
        phone: userInfo.phone || '',
        realName: userInfo.realName || '',
        academy: userInfo.academy || '',
        className: userInfo.className || '',
        studentId: userInfo.studentId || ''
      })
    }
  },

  onChangeAvatarTap() {
    wx.showActionSheet({
      itemList: ['上传微信头像', '选择相册图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.pickWechatAvatar()
        } else if (res.tapIndex === 1) {
          this.pickAlbumImage()
        }
      }
    })
  },

  pickWechatAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        this.uploadAvatar(res.tempFiles[0].tempFilePath)
      }
    })
  },

  pickAlbumImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadAvatar(res.tempFilePaths[0])
      }
    })
  },

  async uploadAvatar(filePath) {
    ErrorHandler.showLoading('上传中...')

    try {
      const userStore = UserStore.getInstance()
      const userId = userStore.userId || 'user'

      const cloudPath = `avatars/${userId}_${Date.now()}.jpg`
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })

      this.setData({ avatarUrl: fileID })
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('头像上传成功')
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onSave() {
    if (this.data.isSubmitting) return

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

    const userService = UserService.getInstance()
    userService.updateUser({
      avatarUrl: this.data.avatarUrl,
      phone: this.data.phone
    }).then(() => {
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('保存成功')

      const userStore = UserStore.getInstance()
      userStore.updateUserInfo({
        avatarUrl: this.data.avatarUrl,
        phone: this.data.phone
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch((error) => {
      ErrorHandler.hideLoading()
      this.setData({ isSubmitting: false })
      ErrorHandler.handle(error)
    })
  },

  onCancel() {
    wx.navigateBack()
  }
})
