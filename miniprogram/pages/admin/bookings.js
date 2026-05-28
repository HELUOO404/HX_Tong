const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

Page({
  ...ThemeMixin,

  data: {
    isLoading: true,
    bookings: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待审批' },
      { id: 'approved', name: '已通过' },
      { id: 'rejected', name: '已拒绝' },
      { id: 'cancelled', name: '已取消' },
      { id: 'completed', name: '已结束' },
      { id: 'expired', name: '已过期' }
    ],
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
    this.setData({ activeTab: id }, () => { this.loadBookings(true) })
  },

  async loadBookings(reset = false) {
    if (reset) this.setData({ page: 1, bookings: [] })
    this.setData({ isLoading: true })

    try {
      const params = { page: this.data.page, pageSize: this.data.pageSize }
      if (this.data.activeTab !== 'all') params.status = this.data.activeTab

      const data = await adminService.getManageBookings(params)
      const { list, pagination } = data
      const hasMore = pagination.page * pagination.pageSize < pagination.total

      this.setData({
        bookings: reset ? list : [...this.data.bookings, ...list],
        total: pagination.total,
        hasMore,
        isLoading: false
      })
    } catch (error) {
      console.error('加载预约列表失败:', error)
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
      this.loadBookings(true)
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
      this.loadBookings(true)
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
    }
  },

  onLoadMore() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 }, () => { this.loadBookings() })
    }
  },

  onPullDownRefresh() {
    this.loadBookings(true).finally(() => { wx.stopPullDownRefresh() })
  },

  onReachBottom() {
    this.onLoadMore()
  }
})
