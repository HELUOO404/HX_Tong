const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const adminService = AdminService.getInstance()
const { checkAdminAuth } = require('../../utils/permission')

Page({
  ...ThemeMixin,

  data: {
    bookingId: '',
    booking: null,
    room: null,
    userInfo: null,
    creditScore: 100,
    isLoading: true,
    isSubmitting: false,
    showRejectModal: false,
    rejectReason: ''
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)
    if (!this.checkAdminAuth()) return
    if (options.id) {
      this.setData({ bookingId: options.id })
      this.loadBookingDetail()
    } else if (options.booking) {
      try {
        const booking = JSON.parse(decodeURIComponent(options.booking))
        this.setData({
          booking: booking.booking || booking,
          room: booking.roomInfo,
          userInfo: booking.userInfo,
          creditScore: booking.creditScore || 100,
          creditBadge: this.getCreditScoreBadge(booking.creditScore || 100),
          isLoading: false
        })
      } catch (e) {
        console.error('[ApprovalDetail] 解析booking数据失败:', e)
        ErrorHandler.showError('数据加载失败')
        wx.navigateBack()
      }
    } else {
      ErrorHandler.showError('参数错误')
      wx.navigateBack()
    }
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  checkAdminAuth() {
    return checkAdminAuth()
  },

  async loadBookingDetail() {
    this.setData({ isLoading: true })
    try {
      const data = await adminService.getManageBookings({
        page: 1,
        pageSize: 1,
        bookingId: this.data.bookingId
      })
      if (data.list && data.list.length > 0) {
        const booking = data.list[0]
        this.setData({
          booking: booking,
          room: booking.roomInfo,
          userInfo: booking.userInfo,
          creditScore: booking.creditScore || 100,
          creditBadge: this.getCreditScoreBadge(booking.creditScore || 100),
          isLoading: false
        })
      } else {
        await this.loadBookingDetailDirect()
      }
    } catch (error) {
      console.error('[ApprovalDetail] 加载预约详情失败:', error)
      await this.loadBookingDetailDirect()
    }
  },

  async loadBookingDetailDirect() {
    try {
      const db = wx.cloud.database()
      const { data: booking } = await db.collection('bookings').doc(this.data.bookingId).get()
      if (!booking) {
        ErrorHandler.showError('预约不存在')
        wx.navigateBack()
        return
      }

      let userInfo = { realName: '', phone: '', avatarUrl: '' }
      let creditScore = 100

      try {
        const { data: user } = await db.collection('users').where({ _openid: booking.userId }).get()
        if (user && user.length > 0) {
          userInfo = {
            realName: user[0].realName || '',
            phone: user[0].phone || '',
            avatarUrl: user[0].avatarUrl || ''
          }
        }
      } catch (e) {
        console.error('[ApprovalDetail] 获取用户信息失败:', e)
      }

      try {
        const { data: credit } = await db.collection('credit_scores').where({ userId: booking.userId }).get()
        if (credit && credit.length > 0) {
          creditScore = credit[0].currentScore || credit[0].score || 100
        }
      } catch (e) {
        console.error('[ApprovalDetail] 获取信誉分失败:', e)
      }

      let roomInfo = null
      if (booking.roomId) {
        try {
          const { data: room } = await db.collection('rooms').doc(booking.roomId).get()
          if (room) {
            roomInfo = { name: room.name, location: room.location, capacity: room.capacity }
          }
        } catch (e) {
          console.error('[ApprovalDetail] 获取会议室信息失败:', e)
        }
      }

      this.setData({
        booking: booking,
        room: roomInfo,
        userInfo: userInfo,
        creditScore: creditScore,
        creditBadge: this.getCreditScoreBadge(creditScore),
        isLoading: false
      })
    } catch (error) {
      console.error('[ApprovalDetail] 直接加载预约详情失败:', error)
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  getCreditScoreBadge(score) {
    if (score >= 90) return { text: '优秀', color: '#52c41a' }
    if (score >= 80) return { text: '良好', color: '#1890ff' }
    if (score >= 60) return { text: '一般', color: '#faad14' }
    return { text: '较差', color: '#ff4d4f' }
  },

  onApprove() {
    wx.showModal({
      title: '确认通过',
      content: '确定要通过此预约申请吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.handleApprove()
        }
      }
    })
  },

  async handleApprove() {
    if (this.data.isSubmitting) return
    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('处理中...')
    try {
      await adminService.approveBooking(this.data.bookingId, 'approve')
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('审批通过')
      setTimeout(() => { wx.navigateBack() }, 1500)
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.setData({ isSubmitting: false })
    }
  },

  onShowRejectModal() {
    this.setData({ showRejectModal: true, rejectReason: '' })
  },

  onCloseRejectModal() {
    this.setData({ showRejectModal: false, rejectReason: '' })
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value })
  },

  async onConfirmReject() {
    if (!this.data.rejectReason || !this.data.rejectReason.trim()) {
      ErrorHandler.showError('请输入拒绝原因')
      return
    }
    if (this.data.isSubmitting) return
    this.setData({ isSubmitting: true, showRejectModal: false })
    ErrorHandler.showLoading('处理中...')
    try {
      await adminService.approveBooking(this.data.bookingId, 'reject', this.data.rejectReason.trim())
      ErrorHandler.hideLoading()
      ErrorHandler.showSuccess('已拒绝')
      setTimeout(() => { wx.navigateBack() }, 1500)
    } catch (error) {
      ErrorHandler.hideLoading()
      ErrorHandler.handle(error)
      this.setData({ isSubmitting: false })
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
