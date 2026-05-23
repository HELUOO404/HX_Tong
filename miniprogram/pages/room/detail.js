/**
 * @file 会议室详情页
 * @description 展示会议室详细信息和预约入口，含每日会议安排
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const RoomService = require('../../services/roomService')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const {
  formatDate,
  getScheduleTitle,
  getScheduleViewDateRange,
  generateCalendarDays,
  buildScheduleItems
} = require('../../utils/bookingCalendar')

Page({
  ...ThemeMixin,

  data: {
    roomId: '',
    roomInfo: null,
    isLoading: true,
    selectedDate: '',
    scheduleTitle: '今日安排',
    scheduleList: [],
    scheduleLoading: false,
    datePickerReady: false,
    showCalendar: false,
    calendarYear: 0,
    calendarMonth: 0,
    calendarDays: [],
    minDate: 0,
    maxDate: 0,
    calendarTouchStartX: 0,
    calendarTouchStartY: 0,
    dateAvailability: {}
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)

    const { id } = options
    if (!id) {
      ErrorHandler.showError('参数错误')
      wx.navigateBack()
      return
    }

    const today = formatDate(new Date())
    this.setData({
      roomId: id,
      selectedDate: today,
      scheduleTitle: getScheduleTitle(today)
    })
    this.loadRoomDetail(id)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (this.data.roomId && this.data.datePickerReady) {
      this.loadSchedule()
    }
  },

  async loadRoomDetail(roomId) {
    this.setData({ isLoading: true })

    try {
      const roomService = RoomService.getInstance()
      const roomInfo = await roomService.getRoomDetail(roomId)
      const processedRoom = this.processRoomData(roomInfo)
      this.initDatePicker()
      this.setData({ roomInfo: processedRoom, isLoading: false })
      this.loadSchedule()
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  initDatePicker() {
    const range = getScheduleViewDateRange()
    let selectedDate = this.data.selectedDate || range.defaultDate
    const parts = selectedDate.split('-')
    const selectedTime = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime()
    if (selectedTime < range.minDate || selectedTime > range.maxDate) {
      selectedDate = range.defaultDate
    }

    const calendarYear = Number(parts[0]) || range.calendarYear
    const calendarMonth = Number(parts[1]) || range.calendarMonth

    this.setData({
      minDate: range.minDate,
      maxDate: range.maxDate,
      selectedDate,
      scheduleTitle: getScheduleTitle(selectedDate),
      calendarYear,
      calendarMonth,
      datePickerReady: true,
      calendarDays: generateCalendarDays({
        calendarYear,
        calendarMonth,
        selectedDate,
        minDate: range.minDate,
        maxDate: range.maxDate,
        allowAnyDate: true
      })
    })
  },

  async loadSchedule() {
    const { roomId, selectedDate } = this.data
    if (!roomId || !selectedDate) return

    this.setData({ scheduleLoading: true })

    try {
      const roomService = RoomService.getInstance()
      const data = await roomService.getTimeSlots(roomId, selectedDate)
      const scheduleList = buildScheduleItems(data.bookings || [], selectedDate)

      this.setData({
        scheduleList,
        scheduleLoading: false,
        scheduleTitle: getScheduleTitle(selectedDate)
      })
    } catch (error) {
      console.error('[RoomDetail] 加载会议安排失败:', error)
      this.setData({ scheduleList: [], scheduleLoading: false })
    }
  },

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

  onBookNow() {
    const { roomId } = this.data
    wx.navigateTo({
      url: `/pages/booking/create?roomId=${roomId}`
    })
  },

  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset
    const { images } = this.data.roomInfo

    wx.previewImage({
      current: url,
      urls: images.length > 0 ? images : [url]
    })
  },

  onShowCalendar() {
    if (!this.data.datePickerReady) return
    this.setData({ showCalendar: true })
    this.refreshCalendarDays()
    this.loadMonthAvailability()
  },

  onCloseCalendar() {
    this.setData({ showCalendar: false })
  },

  refreshCalendarDays() {
    const { calendarYear, calendarMonth, selectedDate, minDate, maxDate, dateAvailability } = this.data
    this.setData({
      calendarDays: generateCalendarDays({
        calendarYear,
        calendarMonth,
        selectedDate,
        minDate,
        maxDate,
        dateAvailability,
        allowAnyDate: true
      })
    })
  },

  async loadMonthAvailability() {
    const { roomId, calendarYear, calendarMonth } = this.data
    if (!roomId) return

    const startDate = formatDate(new Date(calendarYear, calendarMonth - 1, 1))
    const endDate = formatDate(new Date(calendarYear, calendarMonth, 0))

    try {
      const roomService = RoomService.getInstance()
      const data = await roomService.getDateAvailability(roomId, startDate, endDate)
      this.setData({ dateAvailability: data.dateMap || {} })
    } catch (error) {
      console.error('[RoomDetail] 加载日期预约状态失败:', error)
      this.setData({ dateAvailability: {} })
    }
    this.refreshCalendarDays()
  },

  onPrevMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth--
    if (calendarMonth < 1) {
      calendarMonth = 12
      calendarYear--
    }
    this.setData({ calendarYear, calendarMonth })
    this.refreshCalendarDays()
    this.loadMonthAvailability()
  },

  onNextMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth++
    if (calendarMonth > 12) {
      calendarMonth = 1
      calendarYear++
    }
    this.setData({ calendarYear, calendarMonth })
    this.refreshCalendarDays()
    this.loadMonthAvailability()
  },

  onCalendarDayTap(e) {
    const { date, selectable } = e.currentTarget.dataset
    if (!selectable || !date) return

    const parts = date.split('-')
    const year = Number(parts[0])
    const month = Number(parts[1])

    this.setData({
      selectedDate: date,
      scheduleTitle: getScheduleTitle(date),
      calendarYear: year,
      calendarMonth: month,
      showCalendar: false
    })
    this.refreshCalendarDays()
    this.loadSchedule()
  },

  onCalendarTouchStart(e) {
    this.setData({
      calendarTouchStartX: e.touches[0].clientX,
      calendarTouchStartY: e.touches[0].clientY
    })
  },

  onCalendarTouchEnd(e) {
    const { calendarTouchStartX: startX, calendarTouchStartY: startY } = this.data
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startX
    const deltaY = endY - startY

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.onPrevMonth()
      } else {
        this.onNextMonth()
      }
    }
  }
})
