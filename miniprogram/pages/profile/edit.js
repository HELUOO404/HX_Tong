/**
 * @file 个人信息编辑页面
 * @description 用户编辑头像、昵称、备注
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
    isSubmitting: false,
    theme: {}
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userStore = UserStore.getInstance()
    const userInfo = userStore.userInfo

    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '',
        nickname: userInfo.nickname || '',
        remark: userInfo.remark || ''
      })
    }
  },

  onChangeAvatarTap() {
    wx.showActionSheet({
      itemList: ['选择相册图片', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.pickAlbumImage()
        } else if (res.tapIndex === 1) {
          this.pickCameraImage()
        }
      }
    })
  },

  pickAlbumImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.uploadAvatar(res.tempFilePaths[0])
      }
    })
  },

  pickCameraImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
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

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onSave() {
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

    const userService = UserService.getInstance()
    userService.updateUser({
      avatarUrl: this.data.avatarUrl,
      nickname,
      remark
    }).then(() => {
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('保存成功')

      const userStore = UserStore.getInstance()
      userStore.updateUserInfo({
        avatarUrl: this.data.avatarUrl,
        nickname,
        remark
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
