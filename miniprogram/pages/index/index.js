/**
 * @file 首页
 * @description 小程序首页，展示快捷入口和今日预约
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const UserStore = require('../../stores/userStore')
const BookingService = require('../../services/bookingService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  // 引入主题混入
  ...ThemeMixin,

  data: {
    userInfo: null,
    isLogin: false,
    isLoading: true,
    todayBookings: [],
    quickActions: [
      { id: 'booking', name: '会议室预约', icon: '/assets/images/icons/room.png', color: '#1890FF' },
      { id: 'schedule', name: '课表查询', icon: '/assets/images/icons/schedule.png', color: '#52C41A' },
      { id: 'mybookings', name: '我的预约', icon: '/assets/images/icons/booking.png', color: '#FAAD14' },
      { id: 'credit', name: '信誉分', icon: '/assets/images/icons/credit.png', color: '#722ED1' }
    ],
    noticeList: [
      { id: 1, title: '欢迎使用红芯通小程序', type: 'info' },
      { id: 2, title: '会议室预约功能已上线', type: 'success' }
    ]
  },

  _unsubscribeUserStore: null,

  onLoad() {
    // 调用混入的 onLoad 来初始化主题
    ThemeMixin.onLoad.call(this)

    // 订阅用户信息变化
    const userStore = UserStore.getInstance()
    this._unsubscribeUserStore = userStore.subscribe((state) => {
      this.setData({
        userInfo: state.userInfo,
        isLogin: state.isLogin
      })
    })
  },

  onShow() {
    // 调用混入的 onShow 来检查主题变化
    ThemeMixin.onShow.call(this)

    // 强制检查登录状态（包括profileCompleted）
    const userStore = UserStore.getInstance()
    const isReallyLogin = userStore.isLogin

    // 更新UI状态
    this.setData({
      isLogin: isReallyLogin,
      userInfo: userStore.userInfo
    })

    if (isReallyLogin) {
      this.loadTodayBookings()
    } else {
      this.setData({ isLoading: false, todayBookings: [] })
    }
  },

  onUnload() {
    if (this._unsubscribeUserStore) {
      this._unsubscribeUserStore()
    }
  },

  onPullDownRefresh() {
    if (this.data.isLogin) {
      this.loadTodayBookings().finally(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 加载今日预约
   */
  async loadTodayBookings() {
    this.setData({ isLoading: true })

    try {
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const bookingService = BookingService.getInstance()
      const result = await bookingService.getMyBookings(null, today, 1, 20)

      this.setData({
        todayBookings: result.list,
        isLoading: false
      })
    } catch (error) {
      console.error('[Index] 加载今日预约失败:', error)
      this.setData({ isLoading: false })
    }
  },

  /**
   * 点击快捷入口
   */
  onQuickActionTap(e) {
    const { id } = e.currentTarget.dataset
    const userStore = UserStore.getInstance()

    switch (id) {
      case 'booking':
        wx.switchTab({ url: '/pages/room/list' })
        break
      case 'schedule':
        ErrorHandler.showError('课表功能开发中，敬请期待')
        break
      case 'mybookings':
        if (!userStore.isLogin) {
          wx.redirectTo({ url: '/pages/login/login' })
          return
        }
        wx.navigateTo({ url: '/pages/booking/mylist' })
        break
      case 'credit':
        if (!userStore.isLogin) {
          wx.redirectTo({ url: '/pages/login/login' })
          return
        }
        wx.navigateTo({ url: '/pages/credit/index' })
        break
    }
  },

  /**
   * 点击今日预约
   */
  onBookingTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/booking/detail?id=${id}`
    })
  },

  /**
   * 立即预约按钮
   */
  onBookNow() {
    wx.switchTab({ url: '/pages/room/list' })
  },

  /**
   * 去登录
   */
  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
