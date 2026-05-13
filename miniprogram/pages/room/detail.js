/**
 * @file 会议室详情页
 * @description 展示会议室详细信息和预约入口
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const RoomService = require('../../services/roomService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  // 引入主题混入
  ...ThemeMixin,

  data: {
    roomId: '',
    roomInfo: null,
    isLoading: true
  },

  onLoad(options) {
    // 调用混入的 onLoad 来初始化主题
    ThemeMixin.onLoad.call(this)

    const { id } = options
    if (!id) {
      ErrorHandler.showError('参数错误')
      wx.navigateBack()
      return
    }

    this.setData({ roomId: id })
    this.loadRoomDetail(id)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (this.data.roomId) {
      this.loadRoomDetail(this.data.roomId)
    }
  },

  /**
   * 加载会议室详情
   */
  async loadRoomDetail(roomId) {
    this.setData({ isLoading: true })

    try {
      const roomService = RoomService.getInstance()
      const roomInfo = await roomService.getRoomDetail(roomId)
      const processedRoom = this.processRoomData(roomInfo)
      this.setData({ roomInfo: processedRoom, isLoading: false })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  /**
   * 处理会议室数据，统一格式
   */
  processRoomData(roomInfo) {
    if (!roomInfo) return null

    const processed = { ...roomInfo }

    processed.images = (processed.images || []).map(img => {
      if (typeof img === 'string') return img
      return img.url || ''
    }).filter(url => url)

    processed.facilities = (processed.facilities || []).map(fac => {
      if (typeof fac === 'string') return fac
      return fac.name || ''
    }).filter(name => name)

    processed.minBookingHours = roomInfo.minBookingHours || 0.5
    processed.maxBookingHours = roomInfo.maxBookingHours || 8
    processed.minAdvanceDays = roomInfo.minAdvanceDays || 0
    processed.maxAdvanceDays = roomInfo.maxAdvanceDays || 0

    return processed
  },

  /**
   * 立即预约
   */
  onBookNow() {
    const { roomId } = this.data
    wx.navigateTo({
      url: `/pages/booking/create?roomId=${roomId}`
    })
  },

  /**
   * 预览图片
   */
  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset
    const { images } = this.data.roomInfo

    wx.previewImage({
      current: url,
      urls: images.length > 0 ? images : [url]
    })
  }
})
