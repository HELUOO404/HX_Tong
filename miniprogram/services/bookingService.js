/**
 * @file 预约服务
 * @description 处理预约相关的业务逻辑
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

class BookingService {
  constructor() {
    this.db = wx.cloud.database()
    this.collection = this.db.collection('bookings')
  }

  static getInstance() {
    if (!BookingService._instance) {
      BookingService._instance = new BookingService()
    }
    return BookingService._instance
  }

  /**
   * 创建预约
   */
  async createBooking(bookingData) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_booking_create',
          params: bookingData
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '创建预约失败')
      }

      return result.data
    } catch (error) {
      console.error('[BookingService] 创建预约失败:', error)
      throw error
    }
  }

  /**
   * 获取我的预约列表
   */
  async getMyBookings(status = null, date = null, page = 1, pageSize = 10) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_booking_getMyList',
          params: { status, date, page, pageSize }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取预约列表失败')
      }

      return result.data
    } catch (error) {
      console.error('[BookingService] 获取预约列表失败:', error)
      throw error
    }
  }

  /**
   * 获取预约详情
   */
  async getBookingDetail(bookingId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_booking_getDetail',
          params: { bookingId }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取预约详情失败')
      }

      return result.data
    } catch (error) {
      console.error('[BookingService] 获取预约详情失败:', error)
      throw error
    }
  }

  /**
   * 取消预约
   */
  async cancelBooking(bookingId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_booking_cancel',
          params: { bookingId }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '取消预约失败')
      }

      return result.data
    } catch (error) {
      console.error('[BookingService] 取消预约失败:', error)
      throw error
    }
  }
}

BookingService._instance = null

module.exports = BookingService
