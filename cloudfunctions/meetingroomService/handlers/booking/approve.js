const { success, error } = require('../../utils/response')
const { restoreResources } = require('../../shared/resourceManager')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()

  const required = ['bookingId', 'action']
  const check = validateRequired(params, required)
  if (!check.valid) return error(400, check.message)

  const { bookingId, action, reason } = params

  if (!['approve', 'reject'].includes(action)) {
    return error(400, 'action参数必须是 approve 或 reject')
  }

  const { data: booking } = await db.collection('bookings').doc(bookingId).get()

  if (!booking) {
    return error(404, '预约不存在')
  }

  if (booking.status !== 'pending') {
    if (booking.status === 'expired') {
      return error(400, '预约已超时，无法审批')
    }
    return error(400, '只能审批待审批状态的预约')
  }

  if (action === 'reject' && !reason) {
    return error(400, '拒绝时必须提供拒绝原因')
  }

  const admin = params._admin || {}
  const updateData = {
    status: action === 'approve' ? 'approved' : 'rejected',
    approverId: admin._id || '',
    approveTime: db.serverDate(),
    updatedAt: db.serverDate()
  }

  if (action === 'reject') {
    updateData.rejectReason = reason
  }

  await db.collection('bookings').doc(bookingId).update({
    data: updateData
  })

  if (action === 'reject') {
    await restoreResources(booking.usedPublicResources)
  }

  return success({
    bookingId,
    status: updateData.status,
    approverId: updateData.approverId,
    approveTime: updateData.approveTime,
    rejectReason: updateData.rejectReason || ''
  }, action === 'approve' ? '预约已通过审批' : '预约已拒绝')
}
