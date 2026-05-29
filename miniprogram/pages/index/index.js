/**
 * @file 首页
 * @description 小程序首页，展示快捷入口与八日内会议安排
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const UserStore = require('../../stores/userStore')
const { APP_NAME } = require('../../config/constants')
const BookingService = require('../../services/bookingService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const {
  formatDate,
  buildBookingDateStrip,
  groupBookingsByDate
} = require('../../utils/bookingCalendar')

Page({
  ...ThemeMixin,

  data: {
    userInfo: null,
    isLogin: false,
    isLoading: true,
    todayDate: '',
    selectedDate: '',
    scrollIntoDay: '',
    weekDays: [],
    bookingsByDate: {},
    displayBookings: [],
    quickActions: [
      { id: 'booking', name: '会议室预约', icon: '/assets/images/icons/room.png', color: '#1890FF' },
      { id: 'schedule', name: '课表查询', icon: '/assets/images/icons/schedule.png', color: '#52C41A' },
      { id: 'mybookings', name: '我的预约', icon: '/assets/images/icons/booking.png', color: '#FAAD14' },
      { id: 'credit', name: '信誉分', icon: '/assets/images/icons/credit.png', color: '#722ED1' }
    ],
    noticeList: [
      { id: 1, title: `欢迎使用${APP_NAME}`, type: 'info' },
      { id: 2, title: '会议室预约功能已上线', type: 'success' }
    ]
  },

  _unsubscribeUserStore: null,

  onLoad() {
    ThemeMixin.onLoad.call(this)

    const todayDate = formatDate(new Date())
    this.setData({
      todayDate,
      selectedDate: todayDate,
      scrollIntoDay: '',
      weekDays: []
    })

    const userStore = UserStore.getInstance()
    this._unsubscribeUserStore = userStore.subscribe((state) => {
      this.setData({
        userInfo: state.userInfo,
        isLogin: state.isLogin
      })
    })
  },

  onShow() {
    ThemeMixin.onShow.call(this)

    const userStore = UserStore.getInstance()
    const isReallyLogin = userStore.isLogin

    this.setData({
      isLogin: isReallyLogin,
      userInfo: userStore.userInfo
    })

    if (isReallyLogin) {
      userStore.refreshUserInfo().catch((error) => {
        console.warn('[index] 刷新用户信息失败:', error)
      })
      this.loadMySchedule()
    } else {
      const todayDate = this.data.todayDate || formatDate(new Date())
      this.setData({
        isLoading: false,
        displayBookings: [],
        bookingsByDate: {},
        weekDays: []
      })
    }
  },

  onUnload() {
    if (this._unsubscribeUserStore) {
      this._unsubscribeUserStore()
    }
  },

  onPullDownRefresh() {
    if (this.data.isLogin) {
      this.loadMySchedule().finally(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  async loadMySchedule() {
    const selectedDate = this.data.selectedDate || this.data.todayDate || formatDate(new Date())
    const todayStr = this.data.todayDate || formatDate(new Date())
    this.setData({ isLoading: true })

    try {
      const bookingService = BookingService.getInstance()
      const result = await bookingService.getMyBookings(null, null, 1, 200)
      const allBookings = result.list || []
      const futureBookings = allBookings.filter(item => item.date && item.date >= todayStr)

      const { weekDays, selectedDate: resolvedDate } = buildBookingDateStrip(
        selectedDate,
        futureBookings
      )
      const stripDates = weekDays.map(item => item.date)
      const bookingsByDate = groupBookingsByDate(futureBookings, stripDates)

      this.setData({
        weekDays,
        selectedDate: resolvedDate,
        bookingsByDate,
        displayBookings: bookingsByDate[resolvedDate] || [],
        scrollIntoDay: weekDays.length > 0 ? `day-${resolvedDate}` : '',
        isLoading: false
      })
    } catch (error) {
      console.error('[Index] 加载会议安排失败:', error)
      this.setData({ isLoading: false })
    }
  },

  onWeekDayTap(e) {
    const { date } = e.currentTarget.dataset
    if (!date || date === this.data.selectedDate) return

    const weekDays = this.data.weekDays.map(item => ({
      ...item,
      isSelected: item.date === date
    }))

    this.setData({
      selectedDate: date,
      weekDays,
      displayBookings: this.data.bookingsByDate[date] || [],
      scrollIntoDay: `day-${date}`
    })
  },

  onQuickActionTap(e) {
    const { id } = e.currentTarget.dataset

    switch (id) {
      case 'booking':
        wx.switchTab({ url: '/pages/room/list' })
        break
      case 'schedule':
        ErrorHandler.showError('课表功能开发中，敬请期待')
        break
      case 'mybookings':
        wx.navigateTo({ url: '/pages/booking/mylist' })
        break
      case 'credit':
        wx.navigateTo({ url: '/pages/credit/index' })
        break
    }
  },

  onBookingTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/booking/detail?id=${id}`
    })
  },

  onBookNow() {
    wx.switchTab({ url: '/pages/room/list' })
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
