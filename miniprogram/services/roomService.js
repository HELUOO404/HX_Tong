/**
 * @file 会议室服务
 * @description 处理会议室相关的业务逻辑
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

class RoomService {
  constructor() {
    this.db = wx.cloud.database()
    this.collection = this.db.collection('rooms')
  }

  static getInstance() {
    if (!RoomService._instance) {
      RoomService._instance = new RoomService()
    }
    return RoomService._instance
  }

  /**
   * 获取会议室列表
   */
  async getRoomList() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_getList',
          params: {}
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取会议室列表失败')
      }

      return result.data
    } catch (error) {
      console.error('[RoomService] 获取会议室列表失败:', error)
      throw error
    }
  }

  /**
   * 获取会议室详情
   */
  async getRoomDetail(roomId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_getDetail',
          params: { roomId }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取会议室详情失败')
      }

      return result.data
    } catch (error) {
      console.error('[RoomService] 获取会议室详情失败:', error)
      throw error
    }
  }

  /**
   * 获取会议室可预约时段
   */
  async getDateAvailability(roomId, startDate, endDate) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_getDateAvailability',
          params: { roomId, startDate, endDate }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取日期预约状态失败')
      }

      return result.data
    } catch (error) {
      console.error('[RoomService] 获取日期预约状态失败:', error)
      throw error
    }
  }

  async getTimeSlots(roomId, date) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_getTimeSlots',
          params: { roomId, date }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取可预约时段失败')
      }

      return result.data
    } catch (error) {
      console.error('[RoomService] 获取可预约时段失败:', error)
      throw error
    }
  }

  async getBookingViewDetail(bookingId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: {
          action: 'meetingroom_booking_viewDetail',
          params: { bookingId }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取预约详情失败')
      }

      return result.data
    } catch (error) {
      console.error('[RoomService] 获取预约详情失败:', error)
      throw error
    }
  }
}

RoomService._instance = null

module.exports = RoomService
