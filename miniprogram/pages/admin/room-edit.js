const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

const FACILITY_TYPES = [
  { type: 'projector', name: '投影仪', icon: 'projector' },
  { type: 'whiteboard', name: '白板', icon: 'whiteboard' },
  { type: 'tv', name: '电视', icon: 'tv' },
  { type: 'audio', name: '音响', icon: 'audio' },
  { type: 'aircon', name: '空调', icon: 'aircon' },
  { type: 'desk', name: '桌椅', icon: 'desk' },
  { type: 'other', name: '其他', icon: 'other' }
]

const STATUS_OPTIONS = [
  { value: 'available', label: '可用' },
  { value: 'unavailable', label: '不可用' },
  { value: 'hidden', label: '隐藏' }
]

Page({
  ...ThemeMixin,

  data: {
    isEdit: false,
    roomId: '',
    name: '',
    location: '',
    capacityMin: '',
    capacityMax: '',
    description: '',
    openTime: '08:00',
    closeTime: '22:00',
    status: 'available',
    statusOptions: STATUS_OPTIONS,
    facilityTypes: FACILITY_TYPES,
    images: [],
    facilities: [],
    publicResources: [],
    approvalRuleId: '',
    approvalRules: [],
    approvalRuleOptions: [],
    publicResourceList: [],
    maxAdvanceDays: 0,
    minAdvanceDays: 0,
    isLoading: false,
    isSubmitting: false,
    showFacilityModal: false,
    showResourceModal: false,
    editingFacility: null,
    facilityName: '',
    facilityType: 'other',
    approvalRuleName: '',
    facilityTypeName: '其他',
    theme: {}
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)
    if (!this.checkAdminAuth()) return
    if (options.id) {
      this.setData({ isEdit: true, roomId: options.id })
      this.loadRoomDetail(options.id)
    }
    this.loadApprovalRules()
    this.loadPublicResources()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadRoomDetail(roomId) {
    this.setData({ isLoading: true })
    try {
      const room = await adminService.getRoomDetail(roomId)
      console.log('[RoomEdit] 加载会议室详情, room.publicResources:', JSON.stringify(room.publicResources))
      const approvalRuleName = this._getApprovalRuleName(room.approvalRuleId || '')
      this.setData({
        name: room.name || '',
        location: room.location || '',
        capacityMin: room.capacity?.min?.toString() || '',
        capacityMax: room.capacity?.max?.toString() || '',
        description: room.description || '',
        openTime: room.openTime || '08:00',
        closeTime: room.closeTime || '22:00',
        status: room.status || 'available',
        images: room.images || [],
        facilities: room.facilities || [],
        publicResources: room.publicResources || [],
        approvalRuleId: room.approvalRuleId || '',
        approvalRuleName: approvalRuleName,
        maxAdvanceDays: room.maxAdvanceDays || 0,
        minAdvanceDays: room.minAdvanceDays || 0,
        isLoading: false
      })
    } catch (error) {
      console.error('[RoomEdit] 加载会议室详情失败:', error)
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  async loadApprovalRules() {
    try {
      const rules = await adminService.getApprovalRuleList()
      this.setData({
        approvalRules: rules || [],
        approvalRuleOptions: [{ name: '使用默认规则' }, ...(rules || []).map(r => ({ _id: r._id, name: r.name }))]
      })
      if (this.data.approvalRuleId) {
        this.setData({
          approvalRuleName: this._getApprovalRuleName(this.data.approvalRuleId)
        })
      }
    } catch (error) {
      console.error('[RoomEdit] 加载审批规则失败:', error)
    }
  },

  async loadPublicResources() {
    try {
      const resources = await adminService.getPublicResourceList()
      this.setData({ publicResourceList: resources || [] })
    } catch (error) {
      console.error('[RoomEdit] 加载公共资源失败:', error)
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onLocationInput(e) { this.setData({ location: e.detail.value }) },
  onCapacityMinInput(e) { this.setData({ capacityMin: e.detail.value }) },
  onCapacityMaxInput(e) { this.setData({ capacityMax: e.detail.value }) },
  onDescriptionInput(e) { this.setData({ description: e.detail.value }) },
  onOpenTimeChange(e) { this.setData({ openTime: e.detail.value }) },
  onCloseTimeChange(e) { this.setData({ closeTime: e.detail.value }) },
  onMaxAdvanceDaysInput(e) { this.setData({ maxAdvanceDays: parseInt(e.detail.value) || 0 }) },
  onMinAdvanceDaysInput(e) { this.setData({ minAdvanceDays: parseInt(e.detail.value) || 0 }) },

  onStatusChange(e) {
    const index = e.detail.value
    this.setData({ status: STATUS_OPTIONS[index].value })
  },

  onApprovalRuleChange(e) {
    const index = e.detail.value
    const rules = this.data.approvalRules
    if (index === 0 || !rules || rules.length === 0) {
      this.setData({ approvalRuleId: '', approvalRuleName: '' })
    } else {
      const rule = rules[index - 1]
      this.setData({
        approvalRuleId: rule ? rule._id : '',
        approvalRuleName: rule ? rule.name : ''
      })
    }
  },

  async onChooseImage() {
    if (this.data.images.length >= 9) {
      ErrorHandler.showError('最多只能上传9张图片')
      return
    }
    try {
      const res = await wx.chooseImage({
        count: 9 - this.data.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      ErrorHandler.showLoading('上传中...')
      const uploadedImages = []
      for (const filePath of res.tempFilePaths) {
        const uploadResult = await this.uploadImage(filePath)
        if (uploadResult) uploadedImages.push(uploadResult)
      }
      ErrorHandler.hideLoading()
      this.setData({ images: [...this.data.images, ...uploadedImages] })
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  async uploadImage(filePath) {
    try {
      const ext = filePath.split('.').pop()
      const cloudPath = `room_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
      const result = await wx.cloud.uploadFile({ cloudPath, filePath })
      return { url: result.fileID, fileId: result.fileID, isDefault: this.data.images.length === 0 }
    } catch (error) {
      console.error('[RoomEdit] 上传图片失败:', error)
      return null
    }
  },

  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset
    const urls = this.data.images.map(img => img.url)
    wx.previewImage({ current: url, urls })
  },

  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const images = [...this.data.images]
          images.splice(index, 1)
          if (images.length > 0 && !images[0].isDefault) images[0].isDefault = true
          this.setData({ images })
        }
      }
    })
  },

  onSetDefaultImage(e) {
    const { index } = e.currentTarget.dataset
    const images = this.data.images.map((img, i) => ({ ...img, isDefault: i === index }))
    this.setData({ images })
  },

  onShowFacilityModal() {
    this.setData({ showFacilityModal: true, editingFacility: null, facilityName: '', facilityType: 'other', facilityTypeName: '其他' })
  },

  onEditFacility(e) {
    const { index } = e.currentTarget.dataset
    const facility = this.data.facilities[index]
    const ft = FACILITY_TYPES.find(t => t.type === facility.type)
    this.setData({
      showFacilityModal: true,
      editingFacility: { index, ...facility },
      facilityName: facility.name,
      facilityType: facility.type,
      facilityTypeName: ft ? ft.name : facility.type
    })
  },

  onCloseFacilityModal() {
    this.setData({ showFacilityModal: false, editingFacility: null, facilityName: '', facilityType: 'other', facilityTypeName: '其他' })
  },

  onFacilityNameInput(e) { this.setData({ facilityName: e.detail.value }) },

  onFacilityTypeChange(e) {
    const index = e.detail.value
    const selectedType = FACILITY_TYPES[index]
    this.setData({ facilityType: selectedType.type, facilityTypeName: selectedType.name })
  },

  onAddFacility() {
    if (!this.data.facilityName.trim()) {
      ErrorHandler.showError('请输入设施名称')
      return
    }
    const facility = {
      id: this.data.editingFacility?.id || this.generateId(),
      name: this.data.facilityName.trim(),
      type: this.data.facilityType,
      icon: this.data.facilityType
    }
    let facilities
    if (this.data.editingFacility) {
      facilities = [...this.data.facilities]
      facilities[this.data.editingFacility.index] = facility
    } else {
      facilities = [...this.data.facilities, facility]
    }
    this.setData({ facilities, showFacilityModal: false })
  },

  onDeleteFacility(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个设施吗？',
      success: (res) => {
        if (res.confirm) {
          const facilities = [...this.data.facilities]
          facilities.splice(index, 1)
          this.setData({ facilities })
        }
      }
    })
  },

  onToggleResource(e) {
    const { id } = e.currentTarget.dataset
    const resources = [...this.data.publicResources]
    const index = resources.indexOf(id)
    if (index > -1) {
      resources.splice(index, 1)
    } else {
      resources.push(id)
    }
    console.log('[RoomEdit] 切换资源关联, id:', id, '当前publicResources:', JSON.stringify(resources))
    this.setData({ publicResources: resources })
  },

  generateId() {
    return 'fac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },

  _getApprovalRuleName(ruleId) {
    if (!ruleId) return ''
    const rule = this.data.approvalRules.find(r => r._id === ruleId)
    return rule ? rule.name : ''
  },

  async onSubmit() {
    if (this.data.isSubmitting) return
    if (!this.data.name.trim()) { ErrorHandler.showError('请输入会议室名称'); return }
    if (!this.data.location.trim()) { ErrorHandler.showError('请输入位置描述'); return }

    const capacityMin = parseInt(this.data.capacityMin) || 0
    const capacityMax = parseInt(this.data.capacityMax) || 0
    if (capacityMin <= 0 || capacityMax <= 0) { ErrorHandler.showError('容量必须大于0'); return }
    if (capacityMin > capacityMax) { ErrorHandler.showError('最小容量不能大于最大容量'); return }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('保存中...')

    try {
      const roomData = {
        name: this.data.name.trim(),
        location: this.data.location.trim(),
        capacity: { min: capacityMin, max: capacityMax },
        description: this.data.description.trim(),
        openTime: this.data.openTime,
        closeTime: this.data.closeTime,
        status: this.data.status,
        images: this.data.images.map(img => ({
          url: (img.fileId && img.fileId.startsWith('cloud://')) ? img.fileId : img.url,
          isDefault: !!img.isDefault
        })),
        facilities: this.data.facilities,
        publicResources: this.data.publicResources,
        approvalRuleId: this.data.approvalRuleId || null,
        maxAdvanceDays: Math.max(0, this.data.maxAdvanceDays || 0),
        minAdvanceDays: Math.max(0, this.data.minAdvanceDays || 0)
      }
      console.log('[RoomEdit] 提交数据, publicResources:', JSON.stringify(roomData.publicResources))

      if (this.data.isEdit) {
        await adminService.updateRoom(this.data.roomId, roomData)
      } else {
        await adminService.createRoom(roomData)
      }

      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess(this.data.isEdit ? '更新成功' : '创建成功')
      setTimeout(() => { wx.navigateBack() }, 1500)
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.setData({ isSubmitting: false })
    }
  }
})
