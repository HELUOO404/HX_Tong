/**
 * @file 获取会议室可用时段
 */

const { success, error } = require('../../utils/response')
const { restoreResources } = require('../../shared/resourceManager')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command
  const { roomId, date } = params

  if (!roomId) {
    return error(400, '缺少会议室ID')
  }

  if (!date) {
    return error(400, '缺少日期')
  }

  try {
    const { data: room } = await db.collection('rooms').doc(roomId).get()

    if (!room) {
      return error(404, '会议室不存在')
    }

    if (room.status !== 'available') {
      return success({
        roomId,
        date,
        roomStatus: 'unavailable',
        timeSlots: [],
        slotStatuses: []
      }, '会议室不可用')
    }

    const openTime = room.openTime || '08:00'
    const closeTime = room.closeTime || '22:00'

    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)

    const slots = []
    let currentHour = openHour
    let currentMin = openMin

    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      const nextMin = currentMin + 30
      let nextHour = currentHour + Math.floor(nextMin / 60)
      const nextMinute = nextMin % 60

      if (nextHour > closeHour || (nextHour === closeHour && nextMinute > closeMin)) {
        break
      }

      const endTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`

      slots.push({
        start: startTime,
        end: endTime,
        startTime: startTime,
        endTime: endTime,
        available: true
      })

      currentMin = nextMinute
      currentHour = nextHour
    }

    const now = new Date()
    const cstOffset = 8 * 60 * 60 * 1000
    const cstNow = new Date(now.getTime() + cstOffset)
    const currentTime = cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()
    const currentDate = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`

    try {
      const { data: expiredBookings } = await db.collection('bookings')
        .where({
          roomId,
          date: _.lte(currentDate),
          status: _.in(['approved', 'pending'])
        })
        .limit(50)
        .get()

      for (const booking of expiredBookings) {
        if (!booking.endTime) continue
        if (booking.status === 'pending') {
          const startParts = booking.startTime.split(':')
          const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
          if (booking.date < currentDate || (booking.date === currentDate && currentTime >= startMin)) {
            await db.collection('bookings').doc(booking._id).update({
              data: { status: 'expired', updatedAt: db.serverDate() }
            })
            await restoreResources(booking.usedPublicResources)
          }
        } else {
          const endParts = booking.endTime.split(':')
          const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1])
          if (booking.date < currentDate || (booking.date === currentDate && currentTime >= endMin)) {
            await db.collection('bookings').doc(booking._id).update({
              data: { status: 'completed', updatedAt: db.serverDate() }
            })
            await restoreResources(booking.usedPublicResources)
          }
        }
      }
    } catch (e) {
      console.error('[getTimeSlots] 更新过期预约失败:', e)
    }

    const { data: bookings } = await db.collection('bookings')
      .where({
        roomId,
        date,
        status: _.in(['pending', 'approved'])
      })
      .get()

    const slotStatuses = slots.map(slot => {
      const overlapping = bookings.filter(b => {
        return slot.start < b.endTime && slot.end > b.startTime
      })

      if (overlapping.length > 0) {
        const hasPending = overlapping.some(b => b.status === 'pending')
        return {
          ...slot,
          available: false,
          status: hasPending ? 'pending' : 'occupied',
          statusText: hasPending ? '已预约(待审批)' : '已预约'
        }
      }

      return {
        ...slot,
        available: true,
        status: 'available',
        statusText: '可预约'
      }
    })

    return success({
      roomId,
      date,
      roomStatus: 'available',
      openTime,
      closeTime,
      timeSlots: slots,
      slotStatuses,
      bookings: bookings.map(b => ({
        bookingId: b._id,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        userName: b.userName || '',
        purpose: b.purpose || ''
      }))
    }, '获取成功')
  } catch (err) {
    console.error('[getTimeSlots] 获取可用时段失败:', err)
    return error(500, '获取可用时段失败')
  }
}
