const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const { PERMISSION_GROUPS, ROLE_OPTIONS, ROLE_PRESETS } = require('../../config/constants')
const { ALL_PERMISSION_KEYS } = require('../../utils/permission')

const TOTAL_PERMISSIONS = ALL_PERMISSION_KEYS.length

function countEnabledPermissions(permissions) {
  if (!permissions || typeof permissions !== 'object') return 0
  return ALL_PERMISSION_KEYS.filter(key => permissions[key]).length
}

const { checkAdminAuth } = require('../../utils/permission')

function calcModalScrollHeight() {
  try {
    const sys = wx.getSystemInfoSync()
    return Math.max(280, Math.floor(sys.windowHeight * 0.85 - 140))
  } catch (e) {
    return 420
  }
}

const PermissionHandler = {
  onLoad() {
    ThemeMixin.onLoad.call(this)
    if (!this.checkAdminAuth()) return
    this.setData({
      permissionGroups: PERMISSION_GROUPS,
      roleOptions: ROLE_OPTIONS,
      rolePresets: ROLE_PRESETS,
      totalPerms: TOTAL_PERMISSIONS,
      modalScrollHeight: calcModalScrollHeight()
    })
    this.loadTags()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadTags() {
    this.setData({ isLoading: true })
    try {
      const adminService = AdminService.getInstance()
      const result = await adminService.getPermissionTagList()
      const tags = (result.data || result || []).map(tag => ({
        ...tag,
        permCount: countEnabledPermissions(tag.permissions),
        totalPerms: TOTAL_PERMISSIONS
      }))
      this.setData({ tags, isLoading: false })
    } catch (error) {
      console.error('[PermissionTags] 加载标签失败:', error)
      ErrorHandler.showError('加载权限标签失败')
      this.setData({ isLoading: false })
    }
  },

  onShowAddModal() {
    this.setData({
      showModal: true,
      modalScrollHeight: calcModalScrollHeight(),
      editingTag: null,
      formData: {
        name: '',
        description: '',
        role: '',
        permissions: {}
      },
      selectedRoleIndex: -1,
      selectedRoleLabel: '不预设（自定义配置）'
    })
  },

  onShowEditModal(e) {
    const tag = e.currentTarget.dataset.tag
    let roleIndex = -1
    if (tag.role) {
      roleIndex = ROLE_OPTIONS.findIndex(r => r.role === tag.role)
    }
    this.setData({
      showModal: true,
      modalScrollHeight: calcModalScrollHeight(),
      editingTag: tag,
      formData: {
        name: tag.name || '',
        description: tag.description || '',
        role: tag.role || '',
        permissions: { ...(tag.permissions || {}) }
      },
      selectedRoleIndex: roleIndex,
      selectedRoleLabel: roleIndex >= 0 ? ROLE_OPTIONS[roleIndex].label : '不预设（自定义配置）'
    })
  },

  onCloseModal() {
    this.setData({ showModal: false, editingTag: null })
  },

  onRoleChange(e) {
    const index = parseInt(e.detail.value)
    const option = ROLE_OPTIONS[index]
    this.setData({
      selectedRoleIndex: index,
      selectedRoleLabel: option.label,
      'formData.role': option.role === 'custom' ? '' : option.role
    })

    if (option.role !== 'custom' && ROLE_PRESETS[option.role]) {
      this.setData({
        'formData.permissions': { ...ROLE_PRESETS[option.role] }
      })
      ErrorHandler.showSuccess(`已填充"${option.label}"的默认权限`)
    } else if (option.role === 'custom') {
      this.setData({
        'formData.permissions': {}
      })
    }
  },

  onTogglePermission(e) {
    const { key } = e.currentTarget.dataset
    const currentVal = this.data.formData.permissions[key] || false
    this.setData({
      [`formData.permissions.${key}`]: !currentVal
    })
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  async onSaveTag() {
    const { formData, editingTag } = this.data
    if (!formData.name || !formData.name.trim()) {
      ErrorHandler.showError('请输入标签名称')
      return
    }

    if (editingTag) {
      const duplicate = this.data.tags.find(
        t => t._id !== editingTag._id && t.name === formData.name.trim()
      )
      if (duplicate) {
        wx.showToast({ title: '标签名称已存在', icon: 'none' })
        return
      }
    }

    this.setData({ saving: true })
    try {
      const adminService = AdminService.getInstance()
      if (editingTag) {
        await adminService.updatePermissionTag({
          tagId: editingTag._id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          role: formData.role,
          permissions: formData.permissions
        })
        ErrorHandler.showSuccess('更新成功')
      } else {
        await adminService.createPermissionTag({
          name: formData.name.trim(),
          description: formData.description.trim(),
          role: formData.role,
          permissions: formData.permissions
        })
        ErrorHandler.showSuccess('创建成功')
      }
      this.onCloseModal()
      this.loadTags()
    } catch (error) {
      console.error('[PermissionTags] 保存标签失败:', error)
      ErrorHandler.showError(error.message || '保存失败')
    } finally {
      this.setData({ saving: false })
    }
  },

  async onDeleteTag(e) {
    const tag = e.currentTarget.dataset.tag
    const confirmed = await this.showConfirm(`确定要删除权限标签"${tag.name}"吗？`)
    if (!confirmed) return

    try {
      const adminService = AdminService.getInstance()
      await adminService.deletePermissionTag(tag._id)
      ErrorHandler.showSuccess('删除成功')
      this.loadTags()
    } catch (error) {
      console.error('[PermissionTags] 删除标签失败:', error)
      ErrorHandler.showError(error.message || '删除失败')
    }
  },

  showConfirm(content) {
    return new Promise(resolve => {
      wx.showModal({
        title: '确认操作',
        content,
        confirmColor: '#FF4D4F',
        success: res => resolve(res.confirm),
        fail: () => resolve(false)
      })
    })
  },

  preventBubble() {}
}

Page(PermissionHandler)
