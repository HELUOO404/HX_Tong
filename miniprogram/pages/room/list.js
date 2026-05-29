/**
 * @file 会议室列表页
 * @description 展示所有可预约的会议室
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const RoomService = require('../../services/roomService')
const UserStore = require('../../stores/userStore')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  // 引入主题混入
  ...ThemeMixin,

  data: {
    isLoading: true,
    roomList: [],
    currentDate: ''
  },

  onLoad() {
    // 调用混入的 onLoad 来初始化主题
    ThemeMixin.onLoad.call(this)

    this.setData({
      currentDate: new Date().toISOString().split('T')[0]
    })
    this.loadRoomList()
  },

  onShow() {
    ThemeMixin.onShow.call(this)

    if (!this.data.isLoading) {
      this.loadRoomList()
    }
  },

  onPullDownRefresh() {
    this.loadRoomList().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载会议室列表
   */
  async loadRoomList() {
    this.setData({ isLoading: true })
    ErrorHandler.showLoading()

    try {
      const roomService = RoomService.getInstance()
      const rooms = await roomService.getRoomList()
      const processedRooms = this.processRoomList(rooms)

      this.setData({
        roomList: processedRooms,
        isLoading: false
      })
    } catch (error) {
      this.setData({ isLoading: false })
      ErrorHandler.handle(error)
    } finally {
      ErrorHandler.hideLoading()
    }
  },

  /**
   * 处理会议室列表数据，统一格式
   */
  processRoomList(rooms) {
    if (!Array.isArray(rooms)) return []

    return rooms.map(room => {
      const processed = { ...room }

      // 处理图片 - 提取第一个图片的 URL
      if (processed.images && processed.images.length > 0) {
        const firstImage = processed.images[0]
        processed.firstImage = typeof firstImage === 'string' ? firstImage : (firstImage.url || '')
      } else {
        processed.firstImage = '/assets/images/room-default.png'
      }

      // 处理设施 - 提取名称
      if (processed.facilities && processed.facilities.length > 0) {
        processed.facilities = processed.facilities.map(fac => {
          if (typeof fac === 'string') return fac
          return fac.name || ''
        }).filter(name => name)
      } else {
        processed.facilities = []
      }

      return processed
    })
  },

  /**
   * 点击会议室卡片
   */
  onRoomTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/room/detail?id=${id}`
    })
  },

  /**
   * 立即预约
   */
  onBookTap(e) {
    const userStore = UserStore.getInstance()
    if (!userStore.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再预约会议室',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' })
          }
        }
      })
      return
    }
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/booking/create?roomId=${id}`
    })
  }
})
