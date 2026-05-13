/**
 * @file 创建预约页面
 * @description 填写预约信息并提交
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 2.0.0
 */

const RoomService = require('../../services/roomService')
const BookingService = require('../../services/bookingService')
const UserStore = require('../../stores/userStore')
const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    roomId: '',
    roomInfo: null,
    selectedDate: '',
    todayDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: '',
    contactPhone: '',
    timeSlots: [],
    availableSlots: [],
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
    isLoading: false,
    isSubmitting: false,
    durationText: '',
    isTimeAvailable: false,
    availableStartTime: '08:00',
    availableEndTime: '22:00',
    creditScore: 100,
    publicResources: [],
    selectedResources: [],
    resourceEmptyReason: '',
    selectingEnd: false,
    datePickerReady: false,
    showCalendar: false,
    calendarYear: 2026,
    calendarMonth: 5,
    calendarDays: [],
    calendarTouchStartX: 0,
    calendarTouchStartY: 0,
    noSlotsToday: false
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)

    const userStore = UserStore.getInstance()
    if (!userStore.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再预约会议室',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({ url: '/pages/login/login' })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    const { roomId } = options
    if (!roomId) {
      ErrorHandler.showError('参数错误')
      wx.navigateBack()
      return
    }

    const today = this.formatDate(new Date())
    this.setData({ roomId, todayDate: today })

    this.loadRoomDetail(roomId)
    this.loadCreditScore()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  async loadRoomDetail(roomId) {
    try {
      const roomService = RoomService.getInstance()
      const roomInfo = await roomService.getRoomDetail(roomId)
      if (roomInfo.openTime) {
        this.setData({ availableStartTime: roomInfo.openTime })
      }
      if (roomInfo.closeTime) {
        this.setData({ availableEndTime: roomInfo.closeTime })
      }
      this.setData({ roomInfo })
      this.updateDateRange(roomInfo)
      this.loadPublicResources()
    } catch (error) {
      ErrorHandler.handle(error)
    }
  },

  updateDateRange(roomInfo) {
    const userStore = UserStore.getInstance()
    const now = new Date()
    const today = this.formatDate(now)

    let minDate, maxDate

    if (userStore.isAdmin()) {
      const distantFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      minDate = now.getTime()
      maxDate = distantFuture.getTime()
    } else {
      const maxDays = roomInfo.maxAdvanceDays || 0
      const minDays = roomInfo.minAdvanceDays || 0

      const minDateObj = new Date(now)
      minDateObj.setDate(minDateObj.getDate() + minDays)
      minDateObj.setHours(0, 0, 0, 0)
      minDate = minDateObj.getTime()

      if (maxDays > 0) {
        const maxDateObj = new Date(now)
        maxDateObj.setDate(maxDateObj.getDate() + maxDays)
        maxDateObj.setHours(23, 59, 59, 999)
        maxDate = maxDateObj.getTime()
      } else {
        const distantFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        maxDate = distantFuture.getTime()
      }
    }

    const minDateStr = this.formatDate(new Date(minDate))
    const maxDateStr = maxDate ? this.formatDate(new Date(maxDate)) : ''
    this.setData({ minDate, maxDate, minDateStr, maxDateStr })

    const fallbackDate = this.formatDate(new Date(Math.max(minDate, now.getTime())))
    this.setData({
      selectedDate: fallbackDate,
      datePickerReady: true,
      startTime: '', endTime: '', selectingEnd: false
    })

    // 初始化日历到可选范围的第一个月
    const firstSelectableDate = new Date(Math.max(minDate, now.getTime()))
    this.setData({
      calendarYear: firstSelectableDate.getFullYear(),
      calendarMonth: firstSelectableDate.getMonth() + 1
    })
    this.generateCalendarDays()

    this.generateTimeSlots()
  },

  async loadCreditScore() {
    try {
      const userStore = UserStore.getInstance()
      const userInfo = userStore.userInfo
      if (userInfo && userInfo.creditScore !== undefined) {
        this.setData({ creditScore: userInfo.creditScore })
      }
    } catch (error) {
      console.error('[BookingCreate] 获取信誉分失败:', error)
    }
  },

  async loadPublicResources(date, startTime, endTime) {
    try {
      const callParams = {}
      if (date) callParams.date = date
      if (startTime) callParams.startTime = startTime
      if (endTime) callParams.endTime = endTime

      const { result } = await wx.cloud.callFunction({
        name: 'meetingroomService',
        data: { action: 'meetingroom_getPublicResources', params: callParams }
      })

      if (result.code === 200) {
        const rawData = result.data.list || result.data || []

        const roomResourceIds = (this.data.roomInfo && this.data.roomInfo.publicResources) || []

        let filteredData = []
        if (roomResourceIds.length > 0) {
          filteredData = rawData.filter(r => roomResourceIds.indexOf(r._id) !== -1)
        }

        const hasTimeFilter = date && startTime && endTime

        const resources = filteredData.map(r => {
          const total = r.totalQuantity || 1
          const availableInPeriod = hasTimeFilter ? (r.availableInPeriod !== undefined ? r.availableInPeriod : total) : -1
          const isAvailable = (r.status === 1 || r.status === true || r.status === 'available' || r.status === '1' || (typeof r.status === 'number' && r.status > 0))
            && (hasTimeFilter ? availableInPeriod > 0 : true)
          return {
            ...r,
            totalQuantity: total,
            availableInPeriod: hasTimeFilter ? availableInPeriod : total,
            hasTimeFilter: hasTimeFilter,
            available: isAvailable,
            selected: false
          }
        })

        let emptyReason = ''
        if (resources.length === 0) {
          if (rawData.length === 0) {
            emptyReason = '系统中暂无公共资源'
          } else if (roomResourceIds.length === 0) {
            emptyReason = '该会议室暂未关联公共资源'
          } else {
            emptyReason = '关联的公共资源暂不可用'
          }
        }

        this.setData({ publicResources: resources, resourceEmptyReason: emptyReason })
        return resources
      } else {
        this.setData({ publicResources: [], resourceEmptyReason: '加载公共资源失败' })
        return []
      }
    } catch (error) {
      console.error('[BookingCreate] 加载公共资源失败:', error)
      this.setData({ publicResources: [], resourceEmptyReason: '加载公共资源失败，请刷新重试' })
      return []
    }
  },

  generateTimeSlots() {
    const slots = []
    const startHour = parseInt(this.data.availableStartTime.split(':')[0])
    const startMinute = parseInt(this.data.availableStartTime.split(':')[1])
    const endHour = parseInt(this.data.availableEndTime.split(':')[0])
    const endMinute = parseInt(this.data.availableEndTime.split(':')[1])
    const isToday = this.isDateToday(this.data.selectedDate)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    for (let h = startHour; h <= endHour; h++) {
      for (let m = (h === startHour ? startMinute : 0); m < 60; m += 30) {
        if (h > endHour || (h === endHour && m >= endMinute)) break
        if (isToday && (h < currentHour || (h === currentHour && m <= currentMinute))) continue
        const hour = String(h).padStart(2, '0')
        const minute = String(m).padStart(2, '0')
        const nextMin = m + 30
        const nextHour = h + Math.floor(nextMin / 60)
        const nextMinute = nextMin % 60
        const endHourStr = String(nextHour).padStart(2, '0')
        const endMinStr = String(nextMinute).padStart(2, '0')
        slots.push({
          startTime: `${hour}:${minute}`,
          endTime: `${endHourStr}:${endMinStr}`,
          label: `${hour}:${minute}-${endHourStr}:${endMinStr}`,
          available: true,
          slotStatus: 'available',
          inRange: false
        })
      }
    }
    const noSlotsToday = isToday && slots.length === 0
    this.setData({ timeSlots: slots, noSlotsToday })
    this.loadBookedSlots()
  },

  isDateToday(dateStr) {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return dateStr === `${y}-${m}-${d}`
  },

  async loadBookedSlots() {
    try {
      const roomService = RoomService.getInstance()
      const slotsData = await roomService.getTimeSlots(this.data.roomId, this.data.selectedDate)
      this.setData({ availableSlots: slotsData || [] })
      this.updateSlotAvailability()
    } catch (error) {
      console.error('[BookingCreate] 加载已预约时段失败:', error)
    }
  },

  updateSlotAvailability() {
    const { timeSlots, availableSlots } = this.data
    const slotStatuses = availableSlots.slotStatuses || availableSlots.slots || (Array.isArray(availableSlots) ? availableSlots : [])
    const updatedSlots = timeSlots.map(slot => {
      const matched = Array.isArray(slotStatuses) && slotStatuses.find(s => {
        const sStart = s.startTime || s.start
        return sStart === slot.startTime
      })
      if (matched) {
        const isAvailable = matched.status === 'available'
        return {
          ...slot,
          available: isAvailable,
          slotStatus: matched.status || (isAvailable ? 'available' : 'occupied')
        }
      }
      return slot
    })
    this.setData({ timeSlots: updatedSlots })
    if (this.data.startTime && this.data.endTime) {
      this.updateRangeHighlight()
      this.checkTimeAvailability()
    }
  },

  updateRangeHighlight() {
    const { startTime, endTime, timeSlots } = this.data
    if (!startTime) {
      const cleared = timeSlots.map(s => ({ ...s, inRange: false }))
      this.setData({ timeSlots: cleared })
      return
    }
    if (!endTime) {
      const updatedSlots = timeSlots.map(slot => ({
        ...slot,
        inRange: slot.startTime === startTime
      }))
      this.setData({ timeSlots: updatedSlots })
      return
    }
    const startMin = this.parseTimeToMinutes(startTime)
    const endMin = this.parseTimeToMinutes(endTime)
    const updatedSlots = timeSlots.map(slot => {
      const slotStartMin = this.parseTimeToMinutes(slot.startTime)
      const slotEndMin = this.parseTimeToMinutes(slot.endTime)
      const inRange = slotStartMin >= startMin && slotEndMin <= endMin
      return { ...slot, inRange }
    })
    this.setData({ timeSlots: updatedSlots })
  },

  onSlotTap(e) {
    const { start, end, available, status } = e.currentTarget.dataset
    if (!available) {
      const msg = status === 'pending' ? '该时段有待审批的预约' : '该时段已被预约'
      ErrorHandler.showError(msg)
      return
    }

    const clickStartMin = this.parseTimeToMinutes(start)
    const currentStartMin = this.parseTimeToMinutes(this.data.startTime)

    if (!this.data.startTime || !this.data.selectingEnd) {
      // 第一次点击：设置开始时间
      this.setData({
        startTime: start,
        endTime: '',
        selectingEnd: true,
        isTimeAvailable: false,
        durationText: `已选开始: ${start}，请点击结束时段`
      })
      this.updateRangeHighlight()
    } else if (this.data.selectingEnd) {
      if (clickStartMin < currentStartMin) {
        // 点击了更早的时间：重置开始时间
        this.setData({
          startTime: start,
          endTime: '',
          selectingEnd: true,
          durationText: `已选开始: ${start}，请点击结束时段`
        })
        this.updateRangeHighlight()
      } else {
        // 点击了相同时间（半小时）或更晚的时间：设置结束时间
        this.setData({
          endTime: end,
          selectingEnd: false
        })
        this.updateRangeHighlight()
        this.checkTimeAvailability()
        this.refreshPublicResourcesForTime()
      }
    }
  },

  getTimeAfter(time, addMinutes) {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + addMinutes
    const newH = Math.floor(total / 60)
    const newM = total % 60
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
  },

  onTogglePublicResource(e) {
    const { id } = e.currentTarget.dataset
    if (!this.data.startTime || !this.data.endTime) {
      ErrorHandler.showError('请先选择预约时间')
      return
    }
    const target = this.data.publicResources.find(r => r._id === id)
    if (!target) return
    if (target.hasTimeFilter && target.availableInPeriod <= 0) {
      ErrorHandler.showError('该资源在当前时段已被约满')
      return
    }
    if (!target.available) {
      ErrorHandler.showError('该资源暂无库存')
      return
    }
    const resources = this.data.publicResources.map(r => {
      if (r._id === id) {
        return { ...r, selected: !r.selected }
      }
      return r
    })
    const selectedResources = resources.filter(r => r.selected).map(r => r._id)
    this.setData({ publicResources: resources, selectedResources })
  },

  async refreshPublicResourcesForTime() {
    const { selectedDate, startTime, endTime } = this.data
    if (selectedDate && startTime && endTime) {
      const prevSelected = this.data.publicResources.filter(r => r.selected).map(r => r._id)
      const resources = await this.loadPublicResources(selectedDate, startTime, endTime)
      const updatedResources = resources.map(r => ({
        ...r,
        selected: prevSelected.indexOf(r._id) !== -1 && r.available
      }))
      const selectedResources = updatedResources.filter(r => r.selected).map(r => r._id)
      this.setData({ publicResources: updatedResources, selectedResources })
    }
  },

  checkTimeAvailability() {
    const { startTime, endTime, timeSlots } = this.data
    if (!startTime || !endTime) {
      this.setData({ isTimeAvailable: true, durationText: '' })
      return
    }
    const duration = this.calculateDuration(startTime, endTime)
    if (duration < 30) {
      this.setData({ isTimeAvailable: false, durationText: '预约时长至少30分钟' })
      return
    }
    const startMin = this.parseTimeToMinutes(startTime)
    const endMin = this.parseTimeToMinutes(endTime)
    
    let hasConflict = false
    for (const slot of timeSlots) {
      const slotStartMin = this.parseTimeToMinutes(slot.startTime)
      const slotEndMin = this.parseTimeToMinutes(slot.endTime)
      
      // 检查时段是否与选择的时间范围重叠（时间段重叠判断：s1 < e2 && e1 > s2）
      if (slotStartMin < endMin && slotEndMin > startMin) {
        if (!slot.available) {
          hasConflict = true
          break
        }
      }
    }
    
    const durationText = this.formatDuration(duration)
    this.setData({
      isTimeAvailable: !hasConflict,
      durationText: hasConflict ? '该时段已被预约' : `预约时长: ${durationText}`
    })
  },

  calculateDuration(startTime, endTime) {
    return this.parseTimeToMinutes(endTime) - this.parseTimeToMinutes(startTime)
  },

  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`
    if (hours > 0) return `${hours}小时`
    return `${mins}分钟`
  },

  parseTimeToMinutes(time) {
    if (!time) return 0
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  },

  onDateChange(e) {
    const selectedDate = e.detail.value
    this.setData({ selectedDate, startTime: '', endTime: '', selectingEnd: false, selectedResources: [] })
    this.generateTimeSlots()
    this.loadPublicResources(selectedDate)
  },

  onPurposeInput(e) {
    this.setData({ purpose: e.detail.value })
  },

  onAttendeesInput(e) {
    this.setData({ attendees: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ contactPhone: e.detail.value })
  },

  async onSubmit() {
    if (this.data.isSubmitting) return

    if (this.data.creditScore < 80) {
      ErrorHandler.showError('信誉分低于80分，暂无法预约')
      return
    }

    if (!this.data.startTime || !this.data.endTime) {
      ErrorHandler.showError('请选择预约时间')
      return
    }

    if (!this.data.isTimeAvailable) {
      ErrorHandler.showError('该时段已被预约，请选择其他时间')
      return
    }

    const selectedDateTime = new Date(this.data.selectedDate).getTime()
    if (selectedDateTime < this.data.minDate) {
      ErrorHandler.showError('所选日期未到可预约时间，请重新选择')
      return
    }
    if (this.data.maxDate && selectedDateTime > this.data.maxDate) {
      ErrorHandler.showError('所选日期超出可预约范围，请重新选择')
      return
    }

    if (!this.data.purpose.trim() || this.data.purpose.trim().length < 5) {
      ErrorHandler.showError('请填写预约用途（至少5个字）')
      return
    }

    const attendeesNum = parseInt(this.data.attendees) || 0
    if (attendeesNum <= 0) {
      ErrorHandler.showError('请填写参与人数')
      return
    }
    if (this.data.roomInfo && this.data.roomInfo.capacity) {
      const maxCapacity = this.data.roomInfo.capacity.max || this.data.roomInfo.capacity
      if (attendeesNum > maxCapacity) {
        ErrorHandler.showError(`参与人数超过会议室容量（${maxCapacity}人）`)
        return
      }
    }

    if (!this.data.contactPhone.trim()) {
      ErrorHandler.showError('请填写联系电话')
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(this.data.contactPhone.trim())) {
      ErrorHandler.showError('请填写正确的手机号码')
      return
    }

    this.setData({ isSubmitting: true })
    ErrorHandler.showLoading('提交中...')

    try {
      const bookingService = BookingService.getInstance()
      const durationMinutes = this.calculateDuration(this.data.startTime, this.data.endTime)
      const usedPublicResources = this.data.selectedResources.map(id => {
        const resource = this.data.publicResources.find(r => r._id === id)
        return { resourceId: id, name: resource ? resource.name : '', quantity: 1 }
      })
      const result = await bookingService.createBooking({
        roomId: this.data.roomId,
        date: this.data.selectedDate,
        startTime: this.data.startTime,
        endTime: this.data.endTime,
        duration: durationMinutes / 60,
        purpose: this.data.purpose,
        attendees: attendeesNum,
        contactPhone: this.data.contactPhone,
        usedPublicResources: usedPublicResources.length > 0 ? usedPublicResources : undefined
      })

      ErrorHandler.hideLoading()

      wx.redirectTo({
        url: `/pages/booking/success?bookingId=${result.bookingId}&status=${result.status}`
      })
    } catch (error) {
      ErrorHandler.hideLoading()
      this.setData({ isSubmitting: false })
      ErrorHandler.handle(error)
    }
  },

  generateCalendarDays() {
    const { calendarYear, calendarMonth, selectedDate, minDate, maxDate } = this.data
    const year = calendarYear
    const month = calendarMonth

    // 当月第一天是星期几
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const startWeekday = firstDayOfMonth.getDay() // 0=周日

    // 当月总天数
    const daysInMonth = new Date(year, month, 0).getDate()

    // 上月总天数（用于填充前置空白）
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

    const days = []
    const today = this.formatDate(new Date())

    // 填充上月尾部日期（灰色显示）
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const dateStr = this.formatDate(new Date(year, month - 2, day))
      days.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelectable: false,
        isSelected: dateStr === selectedDate
      })
    }

    // 当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.formatDate(new Date(year, month - 1, day))
      const dateTime = new Date(year, month - 1, day).getTime()
      const isSelectable = dateTime >= minDate && (!maxDate || dateTime <= maxDate)
      days.push({
        day: day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelectable: isSelectable,
        isSelected: dateStr === selectedDate
      })
    }

    // 填充下月头部日期（灰色显示），补齐到 42 格（6行 x 7列）
    const remaining = 42 - days.length
    for (let day = 1; day <= remaining; day++) {
      const dateStr = this.formatDate(new Date(year, month, day))
      days.push({
        day: day,
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelectable: false,
        isSelected: dateStr === selectedDate
      })
    }

    this.setData({ calendarDays: days })
  },

  onShowCalendar() {
    if (!this.data.datePickerReady) return
    this.setData({ showCalendar: true })
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
      wx.showToast({ title: '该日期不可预约', icon: 'none' })
      return
    }
    this.setData({ selectedDate: date, showCalendar: false })
    this.generateCalendarDays()
    // 触发原有日期变更逻辑
    this.onDateChange({ detail: { value: date } })
  },

  onCalendarTouchStart(e) {
    this.setData({
      calendarTouchStartX: e.touches[0].clientX,
      calendarTouchStartY: e.touches[0].clientY
    })
  },

  onCalendarTouchEnd(e) {
    const startX = this.data.calendarTouchStartX
    const startY = this.data.calendarTouchStartY
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startX
    const deltaY = endY - startY

    // 水平滑动且位移大于垂直位移，且水平位移超过 50rpx
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        this.onPrevMonth()
      } else {
        this.onNextMonth()
      }
    }
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
