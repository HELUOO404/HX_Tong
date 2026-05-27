/**
 * @file 批量获取会议室日期预约状态（空闲/部分已约/已约满）
 */

const { success, error } = require('../../utils/response')
const { buildTimeSlots, getDayAvailability, enumerateDates } = require('../../shared/roomSlots')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command
  const { roomId, startDate, endDate } = params

  if (!roomId) return error(400, '缺少会议室ID')
  if (!startDate || !endDate) return error(400, '缺少日期范围')

  try {
    const { data: room } = await db.collection('rooms').doc(roomId).get()
    if (!room) return error(404, '会议室不存在')

    if (room.status !== 'available') {
      const dateMap = {}
      enumerateDates(startDate, endDate).forEach(date => {
        dateMap[date] = 'full'
      })
      return success({ roomId, startDate, endDate, dateMap }, '获取成功')
    }

    const openTime = room.openTime || '08:00'
    const closeTime = room.closeTime || '22:00'
    const slots = buildTimeSlots(openTime, closeTime)

    const { data: bookings } = await db.collection('bookings')
      .where({
        roomId,
        date: _.gte(startDate).and(_.lte(endDate)),
        status: _.in(['pending', 'approved', 'completed'])
      })
      .get()

    const activeByDate = {}
    const completedByDate = {}
    ;(bookings || []).forEach(booking => {
      if (booking.status === 'completed') {
        completedByDate[booking.date] = true
      } else {
        if (!activeByDate[booking.date]) activeByDate[booking.date] = []
        activeByDate[booking.date].push(booking)
      }
    })

    const dateMap = {}
    enumerateDates(startDate, endDate).forEach(date => {
      const availability = getDayAvailability(slots, activeByDate[date] || [])
      if (availability === 'free' && completedByDate[date]) {
        dateMap[date] = 'completed'
      } else {
        dateMap[date] = availability
      }
    })

    return success({ roomId, startDate, endDate, dateMap }, '获取成功')
  } catch (err) {
    console.error('[getDateAvailability] 失败:', err)
    return error(500, '获取日期预约状态失败')
  }
}
