/**
 * @file 我的预约列表页
 * @description 展示用户的所有预约记录
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const UserStore = require('../../stores/userStore')
const BookingService = require('../../services/bookingService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    isLoading: true,
    bookingList: [],
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待审批' },
      { id: 'approved', name: '已通过' },
      { id: 'rejected', name: '已驳回' },
      { id: 'cancelled', name: '已取消' },
      { id: 'expired', name: '已过期' },
      { id: 'completed', name: '已结束' }
    ]
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)

    const userStore = UserStore.getInstance()
    if (!userStore.isLogin) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    this.loadBookingList()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    this.loadBookingList()
  },

  onPullDownRefresh() {
    this.loadBookingList().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadBookingList() {
    this.setData({ isLoading: true })

    try {
      const bookingService = BookingService.getInstance()
      const status = this.data.activeTab === 'all' ? null : this.data.activeTab
      const result = await bookingService.getMyBookings(status)
      this.setData({
        bookingList: result.list || [],
        isLoading: false
      })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  onTabChange(e) {
    const { index } = e.currentTarget.dataset
    const tab = this.data.tabs[index]
    this.setData({ activeTab: tab.id })
    this.loadBookingList()
  },

  onBookingTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/booking/detail?id=${id}`
    })
  }
})
