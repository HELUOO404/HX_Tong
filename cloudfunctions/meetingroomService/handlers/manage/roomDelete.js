const { success, error, notFound } = require('../../utils/response')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command

  try {
    const required = ['roomId']
    const check = validateRequired(params, required)
    if (!check.valid) return error(400, check.message)

    const { roomId } = params

    const { data: room } = await db.collection('rooms').doc(roomId).get()
    if (!room) {
      return notFound('会议室')
    }

    const { data: unfinishedBookings } = await db.collection('bookings')
      .where({
        roomId,
        status: _.in(['pending', 'approved'])
      })
      .limit(1)
      .get()

    if (unfinishedBookings.length > 0) {
      return error(400, '该会议室存在未完成的预约，无法删除')
    }

    await db.collection('rooms').doc(roomId).update({
      data: {
        status: 'disabled',
        updateTime: db.serverDate()
      }
    })

    return success({
      roomId,
      status: 'disabled'
    }, '会议室已删除')
  } catch (err) {
    console.error('[roomDelete] 删除会议室失败:', err)
    return error(500, '删除会议室失败')
  }
}
