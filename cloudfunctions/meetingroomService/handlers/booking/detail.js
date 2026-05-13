/**
 * @file 获取预约详情处理器
 */

const { success, error } = require('../../utils/response')
const { restoreResources } = require('../../shared/resourceManager')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = cloud.database.command
  const { OPENID } = cloud.getWXContext()

  const required = ['bookingId']
  const check = validateRequired(params, required)
  if (!check.valid) return error(400, check.message)

  const { bookingId } = params

  const { data: booking } = await db.collection('bookings').doc(bookingId).get()

  if (!booking) {
    return error(404, '预约不存在')
  }

  if (booking.userId !== OPENID) {
    const { data: adminData } = await db.collection('admins')
      .where({ _openid: OPENID })
      .limit(1)
      .get()
    if (adminData.length === 0) {
      return error(403, '无权限查看此预约')
    }
  }

  await updateIfExpired(db, _, booking)

  const updatedBooking = (await db.collection('bookings').doc(bookingId).get()).data

  let room = null
  if (updatedBooking.roomId) {
    const { data: roomData } = await db.collection('rooms').doc(updatedBooking.roomId).get()
    if (roomData) {
      room = {
        id: roomData._id,
        name: roomData.name,
        location: roomData.location,
        capacity: roomData.capacity,
        facilities: roomData.facilities,
        images: roomData.images,
        description: roomData.description
      }
    }
  }

  const computedStatus = computeStatus(updatedBooking)

  return success({
    booking: {
      id: updatedBooking._id,
      userId: updatedBooking.userId,
      roomId: updatedBooking.roomId,
      roomName: updatedBooking.roomName,
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime,
      duration: updatedBooking.duration,
      purpose: updatedBooking.purpose,
      attendees: updatedBooking.attendees,
      contactPhone: updatedBooking.contactPhone,
      status: computedStatus,
      statusText: getStatusText(computedStatus),
      needApproval: updatedBooking.needApproval,
      approverId: updatedBooking.approverId,
      approveTime: updatedBooking.approveTime,
      rejectReason: updatedBooking.rejectReason,
      usedPublicResources: updatedBooking.usedPublicResources || [],
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt
    },
    room
  }, '获取预约详情成功')
}

async function updateIfExpired(db, _, booking) {
  if (booking.status !== 'approved' && booking.status !== 'pending') return

  const now = new Date()
  const cstOffset = 8 * 60 * 60 * 1000
  const cstNow = new Date(now.getTime() + cstOffset)
  const currentTime = cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()
  const currentDate = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`

  if (isBookingExpired(booking, currentDate, currentTime)) {
    const targetStatus = booking.status === 'pending' ? 'expired' : 'completed'
    try {
      const updateResult = await db.collection('bookings').where({
        _id: booking._id,
        status: booking.status
      }).update({
        data: {
          status: targetStatus,
          updatedAt: db.serverDate()
        }
      })
      if (updateResult.stats && updateResult.stats.updated > 0) {
        await restoreResources(booking.usedPublicResources)
      }
    } catch (e) {
      console.error('[updateIfExpired] 更新失败:', e)
    }
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

function computeStatus(booking) {
  if (['rejected', 'cancelled', 'completed', 'expired'].includes(booking.status)) {
    return booking.status
  }

  const now = new Date()
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
