const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

const CONDITION_TYPES = [
  { type: 'timeSlot', name: '时段', operators: [
    { value: 'in', label: '属于' },
    { value: 'notIn', label: '不属于' }
  ], valueHint: '如: morning, afternoon, evening, weekday, weekend' },
  { type: 'tag', name: '用户标签', operators: [
    { value: 'in', label: '包含' },
    { value: 'notIn', label: '不包含' }
  ], valueHint: '权限标签名称' },
  { type: 'duration', name: '预约时长(小时)', operators: [
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'lte', label: '小于等于' },
    { value: 'gte', label: '大于等于' }
  ], valueHint: '小时数' },
  { type: 'advanceHours', name: '提前预约(小时)', operators: [
    { value: 'gte', label: '大于等于' },
    { value: 'lt', label: '小于' }
  ], valueHint: '小时数' }
]

const ACTION_OPTIONS = [
  { value: 'manual_approve', label: '人工审批' }
]

function _enrichCondition(condition) {
  const ct = CONDITION_TYPES.find(t => t.type === condition.type)
  return {
    ...condition,
    typeName: ct ? ct.name : condition.type,
    operators: ct ? ct.operators : [],
    operatorLabel: ct ? (ct.operators.find(o => o.value === condition.operator) || {}).label || condition.operator : condition.operator,
    valueHint: ct ? ct.valueHint || '' : ''
  }
}

function _enrichRule(rule, rooms) {
  const roomObj = rooms ? rooms.find(r => r._id === rule.roomId) : null
  const conditionsText = (!rule.conditions || rule.conditions.length === 0)
    ? '无条件'
    : rule.conditions.map(c => {
        const ct = CONDITION_TYPES.find(t => t.type === c.type)
        return ct ? ct.name : c.type
      }).join('、')
  const actionText = ACTION_OPTIONS.find(a => a.value === rule.action)?.label || rule.action
  return {
    ...rule,
    conditionsText,
    actionText,
    roomName: roomObj ? roomObj.name : '未知会议室'
  }
}

Page({
  ...ThemeMixin,

  data: {
    activeTab: 'global',
    tabs: [
      { id: 'global', name: '全局规则' },
      { id: 'meetingroom', name: '会议室规则' }
    ],
    globalRules: [],
    roomRules: [],
    currentRules: [],
    rooms: [],
    roomOptions: [],
    priorityOptions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    conditionTypes: CONDITION_TYPES,
    actionOptions: ACTION_OPTIONS,
    isLoading: true,
    showModal: false,
    editingRule: null,
    formData: {
      name: '',
      type: 'global',
      roomId: '',
      priority: 10,
      conditions: [],
      action: 'manual_approve',
      enabled: true
    },
    formDataRoomName: '',
    formDataActionText: '人工审批',
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
      this.loadData()
    }
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadData() {
    this.setData({ isLoading: true })
    await this.loadRooms()
    await this.loadRules()
    this.updateCurrentRules()
    this.setData({ isLoading: false })
  },

  async loadRules() {
    try {
      const rules = await adminService.getApprovalRuleList()
      const enrichedGlobal = rules.filter(r => r.type === 'global').map(r => _enrichRule(r, this.data.rooms))
      const enrichedRoom = rules.filter(r => r.type === 'meetingroom').map(r => _enrichRule(r, this.data.rooms))
      this.setData({
        globalRules: enrichedGlobal,
        roomRules: enrichedRoom
      })
    } catch (error) {
      console.error('[ApprovalRules] 加载规则列表失败:', error)
      ErrorHandler.handle(error)
    }
  },

  async loadRooms() {
    try {
      const rooms = await adminService.getRoomList()
      this.setData({
        rooms,
        roomOptions: [{ name: '请选择会议室' }, ...rooms.map(r => ({ _id: r._id, name: r.name }))]
      })
    } catch (error) {
      console.error('[ApprovalRules] 加载会议室列表失败:', error)
    }
  },

  updateCurrentRules() {
    const currentRules = this.data.activeTab === 'global' ? this.data.globalRules : this.data.roomRules
    this.setData({ currentRules })
  },

  onTabChange(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ activeTab: id })
    this.updateCurrentRules()
  },

  onShowAddModal() {
    const type = this.data.activeTab
    this.setData({
      showModal: true,
      editingRule: null,
      formData: {
        name: '',
        type,
        roomId: type === 'meetingroom' ? '' : undefined,
        priority: 10,
        conditions: [],
        action: 'manual_approve',
        enabled: true
      },
      formDataRoomName: '',
      formDataActionText: '人工审批'
    })
  },

  onShowEditModal(e) {
    const { rule } = e.currentTarget.dataset
    const enrichedConditions = (rule.conditions || []).map(c => _enrichCondition(c))
    const roomObj = this.data.rooms.find(r => r._id === rule.roomId)
    this.setData({
      showModal: true,
      editingRule: rule,
      formData: {
        name: rule.name || '',
        type: rule.type || 'global',
        roomId: rule.roomId || '',
        priority: rule.priority || 10,
        conditions: enrichedConditions,
        action: rule.action || 'manual_approve',
        enabled: rule.enabled !== false
      },
      formDataRoomName: roomObj ? roomObj.name : '',
      formDataActionText: ACTION_OPTIONS.find(a => a.value === (rule.action || 'manual_approve'))?.label || '人工审批'
    })
  },

  onCloseModal() {
    this.setData({
      showModal: false,
      editingRule: null,
      formData: {
        name: '',
        type: 'global',
        roomId: '',
        priority: 10,
        conditions: [],
        action: 'manual_approve',
        enabled: true
      },
      formDataRoomName: '',
      formDataActionText: '人工审批'
    })
  },

  onNameInput(e) {
    this.setData({ formData: { ...this.data.formData, name: e.detail.value } })
  },

  onRoomChange(e) {
    const index = e.detail.value
    const rooms = this.data.rooms
    if (index === 0) {
      this.setData({ formData: { ...this.data.formData, roomId: '' }, formDataRoomName: '' })
    } else {
      const room = rooms[index - 1]
      this.setData({ formData: { ...this.data.formData, roomId: room._id }, formDataRoomName: room.name })
    }
  },

  onPriorityChange(e) {
    this.setData({ formData: { ...this.data.formData, priority: parseInt(e.detail.value) + 1 } })
  },

  onActionChange(e) {
    const index = e.detail.value
    const selectedAction = ACTION_OPTIONS[index]
    this.setData({
      formData: { ...this.data.formData, action: selectedAction.value },
      formDataActionText: selectedAction.label
    })
  },

  onAddCondition() {
    const conditions = [...this.data.formData.conditions]
    const newCondition = _enrichCondition({ type: 'timeSlot', operator: 'in', value: '' })
    conditions.push(newCondition)
    this.setData({ formData: { ...this.data.formData, conditions } })
  },

  onConditionTypeChange(e) {
    const { index } = e.currentTarget.dataset
    const conditions = [...this.data.formData.conditions]
    const selectedType = this.data.conditionTypes[e.detail.value]
    const updated = _enrichCondition({
      type: selectedType.type,
      operator: selectedType.operators[0]?.value || '',
      value: ''
    })
    conditions[index] = updated
    this.setData({ formData: { ...this.data.formData, conditions } })
  },

  onConditionOperatorChange(e) {
    const { index } = e.currentTarget.dataset
    const conditions = [...this.data.formData.conditions]
    const conditionType = this.data.conditionTypes.find(t => t.type === conditions[index].type)
    if (conditionType) {
      const operatorValue = conditionType.operators[e.detail.value]?.value || ''
      conditions[index] = _enrichCondition({
        ...conditions[index],
        operator: operatorValue
      })
    }
    this.setData({ formData: { ...this.data.formData, conditions } })
  },

  onConditionValueChange(e) {
    const { index } = e.currentTarget.dataset
    const conditions = [...this.data.formData.conditions]
    conditions[index] = _enrichCondition({
      ...conditions[index],
      value: e.detail.value
    })
    this.setData({ formData: { ...this.data.formData, conditions } })
  },

  onEnabledChange(e) {
    this.setData({ formData: { ...this.data.formData, enabled: e.detail.value } })
  },

  onDeleteCondition(e) {
    const { index } = e.currentTarget.dataset
    const conditions = [...this.data.formData.conditions]
    conditions.splice(index, 1)
    this.setData({ formData: { ...this.data.formData, conditions } })
  },

  async onSubmit() {
    const { formData, editingRule, isSubmitting } = this.data
    if (isSubmitting) return
    if (!formData.name.trim()) {
      ErrorHandler.showError('请输入规则名称')
      return
    }
    if (formData.type === 'meetingroom' && !formData.roomId) {
      ErrorHandler.showError('请选择关联会议室')
      return
    }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('保存中...')

    try {
      const params = {
        name: formData.name.trim(),
        type: formData.type,
        priority: formData.priority,
        conditions: formData.conditions.filter(c => c.type && c.operator).map(c => ({
          type: c.type,
          operator: c.operator,
          value: c.value
        })),
        action: formData.action,
        enabled: formData.enabled
      }
      if (formData.type === 'meetingroom') {
        params.roomId = formData.roomId
      }

      if (editingRule) {
        await adminService.updateApprovalRule({ ruleId: editingRule._id, ...params })
      } else {
        await adminService.createApprovalRule(params)
      }

      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess(editingRule ? '更新成功' : '创建成功')
      this.setData({ showModal: false, isSubmitting: false })
      this.loadRules().then(() => this.updateCurrentRules())
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.setData({ isSubmitting: false })
    }
  },

  async onToggle(e) {
    const rule = e.currentTarget.dataset.rule
    if (!rule) return
    const newEnabled = !rule.enabled
    ErrorHandler.showLoading('处理中...')
    try {
      await adminService.toggleApprovalRule(rule._id, newEnabled)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess(newEnabled ? '已启用' : '已禁用')
      this.loadRules().then(() => this.updateCurrentRules())
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.loadRules().then(() => this.updateCurrentRules())
    }
  },

  onDelete(e) {
    const { rule } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定要删除规则 "${rule.name}" 吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.deleteRule(rule._id)
        }
      }
    })
  },

  async deleteRule(ruleId) {
    ErrorHandler.showLoading('删除中...')
    try {
      await adminService.deleteApprovalRule(ruleId)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('删除成功')
      this.loadRules().then(() => this.updateCurrentRules())
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  }
})
