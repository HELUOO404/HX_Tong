const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

Page({
  ...ThemeMixin,

  data: {
    rooms: [],
    isLoading: true,
    theme: {}
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    this.checkAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (wx.getStorageSync('adminInfo')) {
      this.loadRooms()
    }
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadRooms() {
    this.setData({ isLoading: true })
    try {
      const rooms = await adminService.getRoomList({ isAdmin: true })
      const processedRooms = (rooms || []).map(room => {
        const facilityNames = (room.facilities && Array.isArray(room.facilities))
          ? room.facilities.map(f => typeof f === 'string' ? f : (f.name || f.type || '')).filter(Boolean).join('、')
          : ''
        return { ...room, facilityNames }
      })
      this.setData({ rooms: processedRooms, isLoading: false })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ rooms: [], isLoading: false })
    }
  },

  onShowAddModal() {
    wx.navigateTo({ url: '/pages/admin/room-edit' })
  },

  onShowEditModal(e) {
    const { room } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/admin/room-edit?id=${room._id}` })
  },

  onDeleteRoom(e) {
    const { room } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `确定要删除会议室"${room.name}"吗？`,
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            ErrorHandler.showLoading('删除中...')
            await adminService.deleteRoom(room._id)
            ErrorHandler.hideLoading()
            ErrorHandler.showSuccess('删除成功')
            this.loadRooms()
          } catch (error) {
            ErrorHandler.hideLoading()
            ErrorHandler.handle(error)
          }
        }
      }
    })
  }
})
