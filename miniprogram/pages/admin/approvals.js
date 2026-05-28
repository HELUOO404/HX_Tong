const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

Page({
  ...ThemeMixin,

  data: {
    bookings: [],
    isLoading: true,
    activeTab: 'pending',
    tabs: [
      { id: 'pending', name: '待审批' },
      { id: 'approved', name: '已通过' },
      { id: 'rejected', name: '已拒绝' }
    ],
    theme: {},
    showRejectModal: false,
    rejectTargetBooking: null
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    this.checkAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (wx.getStorageSync('adminInfo')) {
      this.loadBookings()
    }
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  onTabChange(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ activeTab: id }, () => {
      this.loadBookings()
    })
  },

  async loadBookings() {
    this.setData({ isLoading: true })
    try {
      const data = await adminService.getManageBookings({ status: this.data.activeTab })
      this.setData({
        bookings: data.list || data,
        isLoading: false
      })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  onViewDetail(e) {
    const { booking } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/admin/approval-detail?id=${booking._id}` })
  },

  async onApprove(e) {
    const { booking } = e.currentTarget.dataset
    try {
      ErrorHandler.showLoading('处理中...')
      await adminService.approveBooking(booking._id, 'approve')
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('审批通过')
      this.loadBookings()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onReject(e) {
    const { booking } = e.currentTarget.dataset
    this.setData({
      showRejectModal: true,
      rejectTargetBooking: booking
    })
  },

  onRejectCancel() {
    this.setData({
      showRejectModal: false,
      rejectTargetBooking: null
    })
  },

  async onRejectConfirm(e) {
    const booking = this.data.rejectTargetBooking
    if (!booking) return

    const reason = e.detail.reason
    this.setData({ showRejectModal: false, rejectTargetBooking: null })

    try {
      ErrorHandler.showLoading('处理中...')
      await adminService.approveBooking(booking._id, 'reject', reason)
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('已拒绝')
      this.loadBookings()
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  }
})
