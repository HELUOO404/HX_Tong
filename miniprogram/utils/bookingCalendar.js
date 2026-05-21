/**
 * @file 预约日期日历工具
 * @description 会议室预约/详情页共用的日历生成与档期处理
 */

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getScheduleTitle(selectedDate) {
  const today = formatDate(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = formatDate(tomorrowDate)

  if (selectedDate === today) return '今日安排'
  if (selectedDate === tomorrow) return '明日安排'

  const parts = selectedDate.split('-')
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日安排`
}

function getDateRangeForRoom(roomInfo, isAdmin) {
  const now = new Date()
  let minDate
  let maxDate

  if (isAdmin) {
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

  const defaultDate = formatDate(new Date(Math.max(minDate, now.getTime())))
  const firstSelectable = new Date(Math.max(minDate, now.getTime()))

  return {
    minDate,
    maxDate,
    defaultDate,
    calendarYear: firstSelectable.getFullYear(),
    calendarMonth: firstSelectable.getMonth() + 1
  }
}

function generateCalendarDays({ calendarYear, calendarMonth, selectedDate, minDate, maxDate, dateAvailability = {} }) {
  const year = calendarYear
  const month = calendarMonth
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const startWeekday = firstDayOfMonth.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const days = []
  const today = formatDate(new Date())

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const dateStr = formatDate(new Date(year, month - 2, day))
    days.push({
      day,
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isSelectable: false,
      isSelected: dateStr === selectedDate
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month - 1, day))
    const dateTime = new Date(year, month - 1, day).getTime()
    const isSelectable = dateTime >= minDate && (!maxDate || dateTime <= maxDate)
    days.push({
      day,
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isSelectable,
      isSelected: dateStr === selectedDate,
      availability: isSelectable ? (dateAvailability[dateStr] || 'free') : ''
    })
  }

  const remaining = 42 - days.length
  for (let day = 1; day <= remaining; day++) {
    const dateStr = formatDate(new Date(year, month, day))
    days.push({
      day,
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isSelectable: false,
      isSelected: dateStr === selectedDate
    })
  }

  return days
}

function getCSTNow() {
  const now = new Date()
  const cstOffset = 8 * 60 * 60 * 1000
  const cstNow = new Date(now.getTime() + cstOffset)
  return {
    currentDate: `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`,
    currentMinutes: cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()
  }
}

function isPastBooking(date, endTime, currentDate, currentMinutes) {
  if (date < currentDate) return true
  if (date > currentDate) return false
  const parts = endTime.split(':').map(Number)
  return currentMinutes >= parts[0] * 60 + parts[1]
}

function buildScheduleItems(bookings, date) {
  const { currentDate, currentMinutes } = getCSTNow()

  return (bookings || [])
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map(item => ({
      bookingId: item.bookingId,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      purpose: item.purpose || '',
      timeRange: `${item.startTime} - ${item.endTime}`,
      displayContent: item.purpose || '未填写用途',
      statusText: item.status === 'pending' ? '待审批' : '已通过',
      isPast: isPastBooking(date, item.endTime, currentDate, currentMinutes)
    }))
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const EIGHT_DAY_WINDOW = 8

function buildEightDayStrip(selectedDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDate(today)
  const activeDate = selectedDate || todayStr
  const strip = []

  for (let i = 0; i < EIGHT_DAY_WINDOW; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = formatDate(d)
    strip.push({
      date: dateStr,
      weekday: i === 0 ? '今' : WEEKDAY_LABELS[d.getDay()],
      day: d.getDate(),
      isToday: dateStr === todayStr,
      isSelected: dateStr === activeDate,
      dotType: ''
    })
  }

  return strip
}

function getEightDayDateList() {
  return buildEightDayStrip(formatDate(new Date())).map(item => item.date)
}

function applyBookingDotsToStrip(weekDays, bookings) {
  const dateRange = new Set(weekDays.map(item => item.date))
  const dotMap = {}

  for (const booking of bookings || []) {
    if (!dateRange.has(booking.date)) continue
    if (booking.status === 'pending') {
      dotMap[booking.date] = 'pending'
    } else if (dotMap[booking.date] !== 'pending') {
      dotMap[booking.date] = 'approved'
    }
  }

  return weekDays.map(day => ({
    ...day,
    dotType: dotMap[day.date] || ''
  }))
}

/**
 * 仅生成有预约记录的日期条（今日及未来）
 */
function buildBookingDateStrip(selectedDate, bookings) {
  const todayStr = formatDate(new Date())
  const dateSet = new Set()
  const dotMap = {}

  for (const booking of bookings || []) {
    if (!booking.date || booking.date < todayStr) continue
    dateSet.add(booking.date)
    if (booking.status === 'pending') {
      dotMap[booking.date] = 'pending'
    } else if (dotMap[booking.date] !== 'pending') {
      dotMap[booking.date] = 'approved'
    }
  }

  const sortedDates = Array.from(dateSet).sort()
  const resolvedSelected = sortedDates.includes(selectedDate)
    ? selectedDate
    : (sortedDates[0] || selectedDate || todayStr)

  const weekDays = sortedDates.map(dateStr => {
    const parts = dateStr.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return {
      date: dateStr,
      weekday: dateStr === todayStr ? '今' : WEEKDAY_LABELS[d.getDay()],
      day: d.getDate(),
      isToday: dateStr === todayStr,
      isSelected: dateStr === resolvedSelected,
      dotType: dotMap[dateStr] || 'approved'
    }
  })

  return { weekDays, selectedDate: resolvedSelected }
}

function groupBookingsByDate(bookings, dateList) {
  const map = {}
  dateList.forEach(date => {
    map[date] = []
  })

  for (const booking of bookings || []) {
    if (!map[booking.date]) continue
    map[booking.date].push(booking)
  }

  dateList.forEach(date => {
    map[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  return map
}

module.exports = {
  formatDate,
  getScheduleTitle,
  getDateRangeForRoom,
  generateCalendarDays,
  buildScheduleItems,
  buildEightDayStrip,
  getEightDayDateList,
  applyBookingDotsToStrip,
  buildBookingDateStrip,
  groupBookingsByDate
}
