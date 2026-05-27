/**
 * @file 用户编辑页面
 * @description 管理员编辑用户信息及权限标签
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 2.1.0
 */

const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()

const ROLE_NAMES = {
  systemAdmin: '系统管理员',
  superAdmin: '超级管理员',
  academyManager: '书院管理人',
  approvalManager: '审批管理人',
  scheduleViewer: '会议安排查看员'
}

Page({
  ...ThemeMixin,

  data: {
    userId: '',
    formData: {
      nickname: '',
      remark: '',
      avatarUrl: '',
      permissionTags: []
    },
    availableTags: [],
    canAssignPermissionTags: false,
    theme: {}
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)

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

    const AdminStore = require('../../stores/adminStore')
    const adminStore = AdminStore.getInstance()
    adminStore._setAdminInfo(adminInfo)

    if (!adminStore.hasPermission('canEditUsers') && !adminStore.hasPermission('canManagePermissions')) {
      ErrorHandler.showError('您没有编辑用户的权限')
      wx.navigateBack()
      return
    }

    let canAssign = false
    if (adminInfo.permissionTags && adminInfo.permissionTags.length > 0) {
      for (const tag of adminInfo.permissionTags) {
        if (tag.permissions && tag.permissions.canAssignPermissionTags) {
          canAssign = true
          break
        }
      }
    }
    this.setData({ canAssignPermissionTags: canAssign })

    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('acceptUserData', (user) => {
      if (!user) {
        ErrorHandler.showError('缺少用户数据')
        wx.navigateBack()
        return
      }
      this.setData({
        userId: user.openid || user._openid || user._id,
        formData: {
          nickname: user.nickname || user.realName || '',
          remark: user.remark || '',
          avatarUrl: user.avatarUrl || '',
          permissionTags: user.permissionTags || []
        }
      })
      if (this.data.canAssignPermissionTags) {
        this.loadPermissionTags()
      }
    })
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  async loadPermissionTags() {
    try {
      const tags = await adminService.getPermissionTagList()
      const userTags = this.data.formData.permissionTags || []
      const availableTags = (tags || []).map(tag => {
        const checked = userTags.some(ut => ut.tagId === (tag.tagId || tag._id))
        return {
          _id: tag._id,
          tagId: tag.tagId || tag._id,
          name: tag.name,
          role: tag.role || '',
          roleName: ROLE_NAMES[tag.role] || '',
          permissions: tag.permissions || {},
          checked
        }
      })
      this.setData({ availableTags })
    } catch (error) {
      console.error('[user-edit] 加载权限标签失败:', error)
    }
  },

  onToggleTag(e) {
    const { index } = e.currentTarget.dataset
    const newTags = this.data.availableTags.map((t, i) => ({
      ...t,
      checked: i === index ? !t.checked : false
    }))
    this.setData({ availableTags: newTags })
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  onChooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadAvatar(tempFilePath)
      }
    })
  },

  async uploadAvatar(filePath) {
    ErrorHandler.showLoading('上传中...')

    try {
      const cloudPath = `avatars/${this.data.userId}_${Date.now()}.jpg`
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })

      this.setData({
        'formData.avatarUrl': fileID
      })

      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('头像上传成功')
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  async onSaveUser() {
    const { userId, formData } = this.data

    if (!formData.nickname.trim()) {
      ErrorHandler.showError('请输入昵称')
      return
    }

    if (formData.remark.trim().length > 200) {
      ErrorHandler.showError('备注不能超过200个字符')
      return
    }

    ErrorHandler.showLoading('保存中...')

    try {
      await adminService.updateUser(userId, formData)

      if (this.data.canAssignPermissionTags) {
        const selectedTags = this.data.availableTags
          .filter(t => t.checked)
          .map(t => ({
            tagId: t.tagId || t._id,
            tagName: t.name,
            role: t.role || '',
            permissions: t.permissions || {}
          }))
        await adminService.updatePermissionTags(userId, selectedTags)
      }

      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('保存成功')

      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.loadUsers) {
        prevPage.loadUsers()
      }
      wx.navigateBack()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onCancel() {
    wx.navigateBack()
  }
})
