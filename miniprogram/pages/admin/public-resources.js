const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

const RESOURCE_TYPES = [
  { type: 'projector', name: '投影仪' },
  { type: 'monitor', name: '显示器' },
  { type: 'whiteboard', name: '移动白板' },
  { type: 'audio', name: '音响设备' },
  { type: 'laptop', name: '笔记本电脑' },
  { type: 'camera', name: '摄像头' },
  { type: 'other', name: '其他' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 1, label: '可用' },
  { value: 0, label: '停用' }
]

Page({
  ...ThemeMixin,

  data: {
    resources: [],
    filteredResources: [],
    isLoading: true,
    activeStatus: 'all',
    statusOptions: STATUS_OPTIONS,
    resourceTypes: RESOURCE_TYPES,
    showModal: false,
    editingResource: null,
    formData: { name: '', type: 'other', totalQuantity: 1, description: '' },
    isSubmitting: false,
    theme: {}
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    this.checkAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (wx.getStorageSync('adminInfo')) {
      this.loadResources()
    }
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadResources() {
    this.setData({ isLoading: true })
    try {
      const resources = await adminService.getPublicResourceList()
      this.setData({
        resources: resources || [],
        filteredResources: resources || [],
        isLoading: false
      })
      this.filterResources()
    } catch (error) {
      console.error('[PublicResources] 加载资源列表失败:', error)
      this.setData({ isLoading: false })
      ErrorHandler.handle(error)
    }
  },

  onStatusChange(e) {
    const index = e.detail.value
    this.setData({ activeStatus: STATUS_OPTIONS[index].value }, () => { this.filterResources() })
  },

  filterResources() {
    const { resources, activeStatus } = this.data
    if (activeStatus === 'all') {
      this.setData({ filteredResources: resources })
    } else {
      this.setData({ filteredResources: resources.filter(r => r.status === activeStatus) })
    }
  },

  onShowAddModal() {
    this.setData({ showModal: true, editingResource: null, formData: { name: '', type: 'other', totalQuantity: 1, description: '' } })
  },

  onShowEditModal(e) {
    const { resource } = e.currentTarget.dataset
    this.setData({
      showModal: true,
      editingResource: resource,
      formData: { name: resource.name || '', type: resource.type || 'other', totalQuantity: resource.totalQuantity || 1, description: resource.description || '' }
    })
  },

  onCloseModal() {
    this.setData({ showModal: false, editingResource: null, formData: { name: '', type: 'other', totalQuantity: 1, description: '' } })
  },

  onNameInput(e) { this.setData({ formData: { ...this.data.formData, name: e.detail.value } }) },

  onTypeChange(e) {
    const index = e.detail.value
    this.setData({ formData: { ...this.data.formData, type: RESOURCE_TYPES[index].type } })
  },

  onDescriptionInput(e) { this.setData({ formData: { ...this.data.formData, description: e.detail.value } }) },

  onQuantityInput(e) { this.setData({ formData: { ...this.data.formData, totalQuantity: parseInt(e.detail.value) || 1 } }) },

  async onSubmit() {
    const { formData, editingResource, isSubmitting } = this.data
    if (isSubmitting) return
    if (!formData.name.trim()) { ErrorHandler.showError('请输入资源名称'); return }
    if (!formData.totalQuantity || formData.totalQuantity < 1) { ErrorHandler.showError('数量至少为1'); return }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('保存中...')

    try {
      const params = { name: formData.name.trim(), type: formData.type, totalQuantity: formData.totalQuantity, description: formData.description.trim() }
      if (editingResource) {
        await adminService.updatePublicResource({ resourceId: editingResource._id, ...params })
      } else {
        await adminService.createPublicResource(params)
      }
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess(editingResource ? '更新成功' : '创建成功')
      this.setData({ showModal: false })
      this.loadResources()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.setData({ isSubmitting: false })
    }
  },

  async onChangeStatus(e) {
    const { resource, status } = e.currentTarget.dataset
    const statusLabel = this.getStatusText(status)
    wx.showModal({
      title: '确认切换状态',
      content: `确定要将 "${resource.name}" 状态切换为 "${statusLabel}" 吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.changeStatus(resource._id, status)
        }
      }
    })
  },

  async changeStatus(resourceId, status) {
    ErrorHandler.showLoading('处理中...')
    try {
      await adminService.changePublicResourceStatus(resourceId, status)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('状态已更新')
      this.loadResources()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onDelete(e) {
    const { resource } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 "${resource.name}" 吗？此操作不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          await this.deleteResource(resource._id)
        }
      }
    })
  },

  async deleteResource(resourceId) {
    ErrorHandler.showLoading('删除中...')
    try {
      await adminService.deletePublicResource(resourceId)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('删除成功')
      this.loadResources()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  getStatusColor(status) {
    if (status === 1) return '#52c41a'
    return '#999'
  },

  getStatusText(status) {
    if (status === 1) return '可用'
    return '停用'
  },

  getResourceTypeName(type) {
    return this.data.resourceTypes.find(t => t.type === type)?.name || ''
  }
})
