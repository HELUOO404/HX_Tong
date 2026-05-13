/**
 * @file 获取我的预约列表处理器
 */

const { success, error } = require('../../utils/response')
const { restoreResources } = require('../../shared/resourceManager')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = cloud.database().command
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return error(401, '用户未登录')
  }

  const { status, date, page = 1, pageSize = 10 } = params

  try {
    await updateExpiredBookings(db, OPENID)
  } catch (err) {
    console.error('[list] updateExpiredBookings 失败:', err)
  }

  const whereClause = {
    userId: OPENID
  }

  if (status && ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'expired'].includes(status)) {
    whereClause.status = status
  }

  if (date) {
    whereClause.date = date
  }

  const skip = (page - 1) * pageSize

  try {
    let bookingsResult
    try {
      bookingsResult = await db.collection('bookings')
        .where(whereClause)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()
    } catch (sortErr) {
      bookingsResult = await db.collection('bookings')
        .where(whereClause)
        .skip(skip)
        .limit(pageSize)
        .get()
    }

    const bookings = bookingsResult.data || []

    const countResult = await db.collection('bookings')
      .where(whereClause)
      .count()

    const total = countResult.total || 0

    const roomIds = [...new Set(bookings.map(b => b.roomId))]

    const roomMap = {}
    if (roomIds.length > 0) {
      try {
        const roomsResult = await db.collection('rooms')
          .where({
            _id: _.in(roomIds)
          })
          .get()

        const rooms = roomsResult.data || []
        rooms.forEach(room => {
          roomMap[room._id] = room
        })
      } catch (roomErr) {
        console.error('[list] 查询会议室失败:', roomErr)
      }
    }

    const now = new Date()
    const list = bookings.map(booking => {
      const computedStatus = computeStatus(booking, now)
      return {
        ...booking,
        status: computedStatus,
        statusText: getStatusText(computedStatus),
        room: roomMap[booking.roomId] ? {
          id: roomMap[booking.roomId]._id,
          name: roomMap[booking.roomId].name,
          location: roomMap[booking.roomId].location,
          capacity: roomMap[booking.roomId].capacity,
          facilities: roomMap[booking.roomId].facilities
        } : null
      }
    })

    return success({
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }, '获取预约列表成功')
  } catch (err) {
    console.error('[list] 获取预约列表失败:', err)
    return error(500, '获取预约列表失败')
  }
}

async function updateExpiredBookings(db, openid) {
  try {
    const now = new Date()
    const cstOffset = 8 * 60 * 60 * 1000
    const cstNow = new Date(now.getTime() + cstOffset)
    const currentTime = cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()
    const currentDate = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`

    const result = await db.collection('bookings')
      .where({
        userId: openid,
        status: _.in(['approved', 'pending'])
      })
      .limit(100)
      .get()

    const bookings = result.data || []
    for (const booking of bookings) {
      if (isBookingExpired(booking, currentDate, currentTime)) {
        const targetStatus = booking.status === 'pending' ? 'expired' : 'completed'
        try {
          const updateResult = await db.collection('bookings')
            .where({ _id: booking._id, status: booking.status })
            .update({
              data: {
                status: targetStatus,
                updatedAt: db.serverDate()
              }
            })
          if (updateResult.stats && updateResult.stats.updated > 0) {
            await restoreResources(booking.usedPublicResources)
          }
        } catch (updateErr) {
          console.error('[list] 更新过期预约失败:', booking._id, updateErr)
        }
      }
    }
  } catch (err) {
    console.error('[list] updateExpiredBookings 异常:', err)
  }
}

function isBookingExpired(booking, currentDate, currentTime) {
  if (!booking.date || !booking.endTime) return false
  if (booking.date < currentDate) {
    return true
  }
  if (booking.date === currentDate) {
    const endTimeParts = booking.endTime.split(':')
    const endMinutes = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1])
    return currentTime >= endMinutes
  }
  return false
}

function computeStatus(booking, now) {
  if (['rejected', 'cancelled', 'completed', 'expired'].includes(booking.status)) {
    return booking.status
  }

  if (!booking.date || !booking.endTime) return booking.status

  const cstOffset = 8 * 60 * 60 * 1000
  const cstNow = new Date(now.getTime() + cstOffset)
  const currentTime = cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()
  const currentDate = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`

  if (booking.date < currentDate || (booking.date === currentDate && currentTime >= getTimeInMinutes(booking.endTime))) {
    if (booking.status === 'pending') {
      return 'expired'
    }
    return 'completed'
  }

  return booking.status
}

function getTimeInMinutes(timeStr) {
  const parts = timeStr.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

function getStatusText(status) {
  const statusMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已结束',
    expired: '已过期'
  }
  return statusMap[status] || status
}
