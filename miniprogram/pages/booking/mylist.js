/**
 * @file 我的预约列表页
 * @description 展示用户的所有预约记录，支持按状态与日期筛选
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const UserStore = require('../../stores/userStore')
const BookingService = require('../../services/bookingService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

const LIST_PAGE_SIZE = 100
const DATES_PAGE_SIZE = 200

Page({
  ...ThemeMixin,

  data: {
    isLoading: true,
    bookingList: [],
    bookingDates: [],
    selectedDate: '',
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'pending', name: '待审批' },
      { id: 'approved', name: '已通过' },
      { id: 'rejected', name: '已驳回' },
      { id: 'cancelled', name: '已取消' },
      { id: 'expired', name: '已过期' },
      { id: 'completed', name: '已结束' }
    ],
    filterDateLabel: '全部日期',
    showCalendar: false,
    calendarYear: 0,
    calendarMonth: 0,
    calendarDays: []
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)

    const userStore = UserStore.getInstance()
    if (!userStore.isLogin) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const now = new Date()
    this.setData({
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1
    })

    this.loadBookingList()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (UserStore.getInstance().isLogin) {
      this.loadBookingList()
    }
  },

  onPullDownRefresh() {
    this.loadBookingList().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  async loadBookingList() {
    this.setData({ isLoading: true })

    try {
      const bookingService = BookingService.getInstance()
      const status = this.data.activeTab === 'all' ? null : this.data.activeTab
      const date = this.data.selectedDate || null

      const [listResult, datesResult] = await Promise.all([
        bookingService.getMyBookings(status, date, 1, LIST_PAGE_SIZE),
        bookingService.getMyBookings(status, null, 1, DATES_PAGE_SIZE)
      ])

      const bookingDates = [...new Set(
        (datesResult.list || []).map(item => item.date).filter(Boolean)
      )].sort((a, b) => b.localeCompare(a))

      this.setData({
        bookingList: listResult.list || [],
        bookingDates,
        filterDateLabel: this.data.selectedDate || '全部日期',
        isLoading: false
      })

      if (this.data.showCalendar) {
        this.generateCalendarDays()
      }
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  generateCalendarDays() {
    const { calendarYear, calendarMonth, selectedDate, bookingDates } = this.data
    const bookingDateSet = new Set(bookingDates || [])
    const year = calendarYear
    const month = calendarMonth

    const firstDayOfMonth = new Date(year, month - 1, 1)
    const startWeekday = firstDayOfMonth.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

    const days = []
    const today = this.formatDate(new Date())

    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const dateStr = this.formatDate(new Date(year, month - 2, day))
      const hasBooking = bookingDateSet.has(dateStr)
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelectable: hasBooking,
        hasBooking,
        isSelected: dateStr === selectedDate
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.formatDate(new Date(year, month - 1, day))
      const hasBooking = bookingDateSet.has(dateStr)
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelectable: hasBooking,
        hasBooking,
        isSelected: dateStr === selectedDate
      })
    }

    const remaining = 42 - days.length
    for (let day = 1; day <= remaining; day++) {
      const dateStr = this.formatDate(new Date(year, month, day))
      const hasBooking = bookingDateSet.has(dateStr)
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelectable: hasBooking,
        hasBooking,
        isSelected: dateStr === selectedDate
      })
    }

    this.setData({ calendarDays: days })
  },

  onShowCalendar() {
    let { calendarYear, calendarMonth } = this.data
    const anchor = this.data.selectedDate || this.data.bookingDates[0]
    if (anchor) {
      const [y, m] = anchor.split('-').map(Number)
      calendarYear = y
      calendarMonth = m
    }

    this.setData({ showCalendar: true, calendarYear, calendarMonth })
    this.generateCalendarDays()
  },

  onCloseCalendar() {
    this.setData({ showCalendar: false })
  },

  onPrevMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth--
    if (calendarMonth < 1) {
      calendarMonth = 12
      calendarYear--
    }
    this.setData({ calendarYear, calendarMonth })
    this.generateCalendarDays()
  },

  onNextMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth++
    if (calendarMonth > 12) {
      calendarMonth = 1
      calendarYear++
    }
    this.setData({ calendarYear, calendarMonth })
    this.generateCalendarDays()
  },

  onCalendarDayTap(e) {
    const { date, selectable } = e.currentTarget.dataset
    if (!selectable) {
      wx.showToast({ title: '该日期暂无预约', icon: 'none' })
      return
    }
    this.setData({
      selectedDate: date,
      filterDateLabel: date,
      showCalendar: false
    })
    this.loadBookingList()
  },

  onClearDateFilter() {
    if (!this.data.selectedDate) return
    this.setData({ selectedDate: '', filterDateLabel: '全部日期' })
    this.loadBookingList()
  },

  onTabChange(e) {
    const { index } = e.currentTarget.dataset
    const tab = this.data.tabs[index]
    this.setData({ activeTab: tab.id, selectedDate: '', filterDateLabel: '全部日期' })
    this.loadBookingList()
  },

  onBookingTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/booking/detail?id=${id}`
    })
  }
})
