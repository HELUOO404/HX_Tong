/**
 * @file 预约详情页
 * @description 展示预约详细信息和操作
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const BookingService = require('../../services/bookingService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    bookingId: '',
    bookingInfo: null,
    isLoading: true
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)
    const { id } = options
    if (!id) {
      ErrorHandler.showError('参数错误')
      wx.navigateBack()
      return
    }

    this.setData({ bookingId: id })
    this.loadBookingDetail(id)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  /**
   * 加载预约详情
   */
  async loadBookingDetail(bookingId) {
    this.setData({ isLoading: true })

    try {
      const bookingService = BookingService.getInstance()
      const result = await bookingService.getBookingDetail(bookingId)
      // 云函数返回 { booking: {...}, room: {...} }
      const bookingInfo = result.booking || result
      this.setData({ bookingInfo, isLoading: false })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  /**
   * 取消预约
   */
  onCancel() {
    const booking = this.data.bookingInfo
    if (!booking) return

    let deductInfo = ''
    if (booking.date && booking.startTime) {
      const bookingStartTime = new Date(`${booking.date}T${booking.startTime}:00+08:00`)
      const hoursUntilBooking = (bookingStartTime - new Date()) / (1000 * 60 * 60)
      if (hoursUntilBooking >= 6) {
        deductInfo = '\n\n免费取消，不扣除信誉分'
      } else if (hoursUntilBooking >= 3) {
        deductInfo = '\n\n将扣除信誉分3分'
      } else if (hoursUntilBooking >= 1) {
        deductInfo = '\n\n将扣除信誉分5分'
      } else {
        deductInfo = '\n\n将扣除信誉分10分'
      }
    }

    wx.showModal({
      title: '提示',
      content: `确定要取消此预约吗？${deductInfo}`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const bookingService = BookingService.getInstance()
            const result = await bookingService.cancelBooking(this.data.bookingId)
            const message = result.creditDeduct > 0
              ? `取消成功，扣除信誉分${result.creditDeduct}分`
              : '取消成功，免费取消'
            ErrorHandler.showSuccess(message)
            this.loadBookingDetail(this.data.bookingId)
          } catch (error) {
            ErrorHandler.handle(error)
          }
        }
      }
    })
  }
})
