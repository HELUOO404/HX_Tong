/**
 * @file 用户管理页面
 * @description 管理员用户管理：查看、编辑、删除、重置头像、信誉分调整
 */

const AdminService = require('../../services/adminService')
const { ErrorHandler } = require('../../utils/errorHandler')
const { checkAdminAuth, checkPermission } = require('../../utils/permission')
const ThemeMixin = require('../../theme/theme-mixin')

const adminService = AdminService.getInstance()

function normalizeUserList(list) {
  return (list || []).map((user) => {
    const tags = user.permissionTags || []
    const seen = new Set()
    const permissionTags = tags.filter((tag) => {
      const key = tag.tagId || tag._id || tag.tagName || tag.name || ''
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    return { ...user, permissionTags }
  })
}

Page({
  ...ThemeMixin,

  data: {
    theme: {},
    users: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    isLoading: false,
    isLoadingMore: false,
    keyword: '',
    currentUser: null,
    isShowEditModal: false,
    isShowDeleteModal: false,
    isShowResetAvatarModal: false,
    adminRole: '',
    filterTabs: [{ id: 'all', name: '全部' }],
    tagFilter: 'all',
    canDeleteUser: false,
    canResetAvatar: false,
    canEditUser: false,
    canAssignPermissionTags: false,
    isShowTagModal: false,
    editingTagUser: null,
    availableTags: [],
    selectedTagIds: [],
    showFilter: false,
    academyOptions: [],
    classOptions: [],
    filterAcademy: '',
    filterClassName: '',
    filterMinCredit: '',
    filterMaxCredit: '',
    filterProfile: 'all',
    creditModalVisible: false,
    creditTargetUser: null,
    creditIsNegative: false,
    creditChangeAbs: '',
    creditReason: '',
    creditPreview: 0
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    if (!this.checkAdminAuth()) return
    this.loadCurrentAdmin()
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    this.loadUsers()
  },

  async loadCurrentAdmin() {
    try {
      const adminInfo = wx.getStorageSync('adminInfo')
      if (adminInfo) {
        this.setData({
          adminRole: adminInfo.role || '',
          canDeleteUser: checkPermission(adminInfo, 'canEditUsers'),
          canResetAvatar: checkPermission(adminInfo, 'canEditUsers'),
          canEditUser: checkPermission(adminInfo, 'canEditUsers'),
          canAssignPermissionTags: checkPermission(adminInfo, 'canAssignPermissionTags')
        })
      }
    } catch (e) {
      console.error('[users] 获取当前管理员信息失败:', e)
    }
    this.loadFilterTabs()
  },

  async loadFilterTabs() {
    try {
      const res = await adminService.getPermissionTagList()
      const tags = res.list || res || []
      const tabs = [{ id: 'all', name: '全部' }]
      tags.forEach(function (tag) {
        tabs.push({ id: tag.tagId || tag._id, name: tag.name || tag.tagName })
      })
      this.setData({ filterTabs: tabs })
    } catch (e) {
      console.error('[users] 加载分类标签失败:', e)
    }
  },

  async loadUsers(filterParams) {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const params = {
        page: 1,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
      }
      if (this.data.tagFilter && this.data.tagFilter !== 'all') {
        if (this.data.tagFilter === 'normal') {
          params.tagFilter = 'none'
        } else {
          params.tagFilter = this.data.tagFilter
        }
      }

      if (filterParams) {
        if (filterParams.academy) params.academy = filterParams.academy
        if (filterParams.className) params.className = filterParams.className
        if (filterParams.minCredit !== undefined) params.minCredit = filterParams.minCredit
        if (filterParams.maxCredit !== undefined) params.maxCredit = filterParams.maxCredit
        if (filterParams.profileCompleted !== undefined) params.profileCompleted = filterParams.profileCompleted
      }

      const res = await adminService.getUserList(params)

      this.setData({
        users: normalizeUserList(res.list),
        total: res.total || 0,
        page: 1,
        totalPages: res.totalPages || 0,
        isLoading: false
      })
    } catch (error) {
      this.setData({
        isLoading: false,
        users: this.data.users || [],
        total: this.data.total || 0,
        totalPages: this.data.totalPages || 0
      })
      ErrorHandler.handle(error)
    }
  },

  async loadMore() {
    if (this.data.isLoadingMore || this.data.page >= this.data.totalPages) return

    this.setData({ isLoadingMore: true })

    try {
      const params = {
        page: this.data.page + 1,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
      }
      if (this.data.tagFilter && this.data.tagFilter !== 'all') {
        if (this.data.tagFilter === 'normal') {
          params.tagFilter = 'none'
        } else {
          params.tagFilter = this.data.tagFilter
        }
      }
      if (this.data.filterAcademy) params.academy = this.data.filterAcademy
      if (this.data.filterClassName) params.className = this.data.filterClassName
      if (this.data.filterMinCredit !== '') params.minCredit = Number(this.data.filterMinCredit)
      if (this.data.filterMaxCredit !== '') params.maxCredit = Number(this.data.filterMaxCredit)
      if (this.data.filterProfile !== 'all') params.profileCompleted = this.data.filterProfile

      const res = await adminService.getUserList(params)

      const newList = normalizeUserList(res.list)
      this.setData({
        users: [...this.data.users, ...newList],
        page: this.data.page + 1,
        isLoadingMore: false
      })
    } catch (error) {
      this.setData({ isLoadingMore: false })
      ErrorHandler.handle(error)
    }
  },

  onTagFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ tagFilter: filter }, () => {
      this.loadUsers()
    })
  },

  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword }, () => {
      this.loadUsers()
    })
  },

  onRefresh() {
    this.setData({ keyword: '' }, () => {
      this.loadUsers()
    })
  },

  getUserFromEvent(e) {
    const rawIndex = e.currentTarget.dataset.idx
    if (rawIndex !== undefined && rawIndex !== '') {
      const index = Number(rawIndex)
      if (!Number.isNaN(index) && this.data.users[index]) {
        return this.data.users[index]
      }
    }
    let user = e.currentTarget.dataset.user
    if (typeof user === 'string') {
      try {
        user = JSON.parse(user)
      } catch (err) {
        user = null
      }
    }
    return user || null
  },

  resolveUserId(user) {
    if (!user) return ''
    return user.openid || user._openid || user._id || ''
  },

  onShowEditModal(e) {
    const user = this.getUserFromEvent(e)
    if (!user) {
      ErrorHandler.showError('无法获取用户信息')
      return
    }
    wx.navigateTo({
      url: '/pages/admin/user-edit',
      success: (res) => {
        res.eventChannel.emit('acceptUserData', user)
      }
    })
  },

  preventBubble() {
    return false
  },

  onShowDeleteModal(e) {
    const user = this.getUserFromEvent(e)
    if (!user) {
      ErrorHandler.showError('无法获取用户信息')
      return
    }
    this.setData({ currentUser: user, isShowDeleteModal: true })
  },

  onCloseDeleteModal() {
    this.setData({ isShowDeleteModal: false, currentUser: null })
  },

  onConfirmDelete() {
    this.doDeleteUser()
  },

  async doDeleteUser() {
    const { currentUser } = this.data
    if (!currentUser) return

    const userId = this.resolveUserId(currentUser)
    if (!userId) {
      ErrorHandler.showError('用户标识无效')
      return
    }

    try {
      ErrorHandler.showLoading('删除中...')
      await adminService.deleteUser(userId)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('删除成功')
      this.onCloseDeleteModal()
      this.loadUsers()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onShowResetAvatarModal(e) {
    const user = this.getUserFromEvent(e)
    if (!user) {
      ErrorHandler.showError('无法获取用户信息')
      return
    }
    this.setData({ currentUser: user, isShowResetAvatarModal: true })
  },

  onCloseResetAvatarModal() {
    this.setData({ isShowResetAvatarModal: false, currentUser: null })
  },

  async onConfirmResetAvatar() {
    const { currentUser } = this.data
    if (!currentUser) return

    const userId = this.resolveUserId(currentUser)
    if (!userId) {
      ErrorHandler.showError('用户标识无效')
      return
    }

    try {
      ErrorHandler.showLoading('重置中...')
      await adminService.resetAvatar(userId)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('头像已重置')
      this.onCloseResetAvatarModal()
      this.loadUsers()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onEditTags(e) {
    var self = this
    var user = e.currentTarget.dataset.user
    var currentTags = user.permissionTags || []
    var currentTagIds = currentTags.map(function(t) { return t.tagId || t._id }).filter(Boolean)

    adminService.getPermissionTagList().then(function(res) {
      var tags = res.list || res || []
      var selectedTagIds = currentTagIds.slice()
      var availableTags = tags.map(function(tag) {
        var tagId = tag.tagId || tag._id
        return {
          tagId: tagId,
          name: tag.name || tag.tagName,
          selected: currentTagIds.indexOf(tagId) !== -1
        }
      })
      self.setData({
        editingTagUser: user,
        availableTags: availableTags,
        selectedTagIds: selectedTagIds,
        isShowTagModal: true
      })
    }).catch(function(err) {
      console.error('[users] 加载标签列表失败:', err)
      wx.showToast({ title: '加载标签失败', icon: 'none' })
    })
  },

  onCloseTagModal() {
    this.setData({
      isShowTagModal: false,
      editingTagUser: null,
      availableTags: [],
      selectedTagIds: []
    })
  },

  onToggleTagSelection(e) {
    var tagId = e.currentTarget.dataset.tagid
    // 单选模式：直接设置为当前选中的标签
    var availableTags = this.data.availableTags.map(function(tag) {
      return { ...tag, selected: tag.tagId === tagId }
    })

    this.setData({
      selectedTagIds: [tagId],
      availableTags: availableTags
    })
  },

  onConfirmTagEdit() {
    var self = this
    var userId = self.data.editingTagUser.openid || self.data.editingTagUser._openid
    var permissionTags = self.data.selectedTagIds.map(function(tagId) {
      var found = self.data.availableTags.find(function(t) { return t.tagId === tagId })
      return {
        tagId: tagId,
        tagName: found ? found.name : '',
        role: found ? (found.role || '') : '',
        permissions: found ? (found.permissions || {}) : {}
      }
    })

    adminService.updatePermissionTags(userId, permissionTags).then(function() {
      wx.showToast({ title: '标签更新成功', icon: 'success' })
      self.setData({
        isShowTagModal: false,
        editingTagUser: null,
        availableTags: [],
        selectedTagIds: []
      })
      self.loadUsers()
    }).catch(function(err) {
      console.error('[users] 更新标签失败:', err)
      wx.showToast({ title: '更新标签失败', icon: 'none' })
    })
  },

  async onShowFilter() {
    if (this.data.academyOptions.length === 0) {
      try {
        const options = await adminService.getFilterOptions()
        this.setData({
          academyOptions: options.academies || [],
          classOptions: options.classes || []
        })
      } catch (e) {
        wx.showToast({ title: '加载筛选选项失败', icon: 'none' })
        return
      }
    }
    this.setData({ showFilter: true })
  },

  onHideFilter() {
    this.setData({ showFilter: false })
  },

  preventClose() {},

  onSelectAcademy(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      filterAcademy: this.data.filterAcademy === value ? '' : value
    })
  },

  onSelectClass(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      filterClassName: this.data.filterClassName === value ? '' : value
    })
  },

  onSelectProfile(e) {
    const value = e.currentTarget.dataset.value
    let profileValue
    if (value === 'true') {
      profileValue = true
    } else if (value === 'false') {
      profileValue = false
    } else {
      profileValue = 'all'
    }
    this.setData({ filterProfile: profileValue })
  },

  onMinCreditInput(e) {
    this.setData({ filterMinCredit: e.detail.value })
  },

  onMaxCreditInput(e) {
    this.setData({ filterMaxCredit: e.detail.value })
  },

  onResetFilter() {
    this.setData({
      filterAcademy: '',
      filterClassName: '',
      filterMinCredit: '',
      filterMaxCredit: '',
      filterProfile: 'all'
    })
  },

  async onApplyFilter() {
    this.setData({ showFilter: false })
    await this.loadUsers({
      academy: this.data.filterAcademy,
      className: this.data.filterClassName,
      minCredit: this.data.filterMinCredit ? Number(this.data.filterMinCredit) : undefined,
      maxCredit: this.data.filterMaxCredit ? Number(this.data.filterMaxCredit) : undefined,
      profileCompleted: this.data.filterProfile === 'all' ? undefined : this.data.filterProfile
    })
  },

  onShowCreditModal(e) {
    const user = this.getUserFromEvent(e)
    if (!user) {
      ErrorHandler.showError('无法获取用户信息')
      return
    }
    this.setData({
      creditTargetUser: user,
      creditModalVisible: true,
      creditIsNegative: false,
      creditChangeAbs: '',
      creditReason: '',
      creditPreview: user.creditScore || 0
    })
  },

  onCloseCreditModal() {
    this.setData({
      creditModalVisible: false,
      creditTargetUser: null,
      creditIsNegative: false,
      creditChangeAbs: '',
      creditReason: '',
      creditPreview: 0
    })
  },

  onSetCreditSign(e) {
    const negative = e.currentTarget.dataset.negative === true || e.currentTarget.dataset.negative === 'true'
    this.setData({ creditIsNegative: negative })
    this.updateCreditPreview(this.data.creditChangeAbs, negative)
  },

  onCreditAmountInput(e) {
    const raw = (e.detail.value || '').replace(/\D/g, '')
    this.setData({ creditChangeAbs: raw })
    this.updateCreditPreview(raw)
  },

  updateCreditPreview(rawAmount, isNegative) {
    const amount = parseInt(rawAmount, 10) || 0
    const negative = typeof isNegative === 'boolean' ? isNegative : this.data.creditIsNegative
    const change = negative ? -amount : amount
    const baseScore = this.data.creditTargetUser ? (this.data.creditTargetUser.creditScore || 0) : 0
    let preview = baseScore + change
    preview = Math.max(0, Math.min(150, preview))
    this.setData({ creditPreview: preview })
  },

  onCreditChangeInput(e) {
    this.onCreditAmountInput(e)
  },

  onCreditReasonInput(e) {
    this.setData({ creditReason: e.detail.value })
  },

  async onConfirmCreditChange() {
    const { creditTargetUser, creditChangeAbs, creditIsNegative, creditReason } = this.data
    if (!creditTargetUser) return

    if (!creditReason || !creditReason.trim()) {
      wx.showToast({ title: '请输入调整原因', icon: 'none' })
      return
    }

    const amount = parseInt(creditChangeAbs, 10) || 0
    const changeNum = creditIsNegative ? -amount : amount
    if (!changeNum || changeNum === 0) {
      wx.showToast({ title: '调整值不能为0', icon: 'none' })
      return
    }

    const userId = this.resolveUserId(creditTargetUser)
    if (!userId) {
      ErrorHandler.showError('用户标识无效')
      return
    }

    try {
      ErrorHandler.showLoading('提交中...')
      await adminService.updateCredit(userId, changeNum, creditReason.trim())
      ErrorHandler.hideLoading()
      wx.showToast({ title: '信誉分调整成功', icon: 'success' })
      this.onCloseCreditModal()
      this.loadUsers()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  }
})
