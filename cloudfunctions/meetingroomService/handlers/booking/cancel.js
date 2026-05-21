/**
 * @file 取消预约处理器
 */

const { success, error } = require('../../utils/response')
const { restoreResources } = require('../../shared/resourceManager')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command
  const { OPENID } = cloud.getWXContext()

  const required = ['bookingId']
  const check = validateRequired(params, required)
  if (!check.valid) return error(400, check.message)

  const { bookingId } = params

  try {
    const { data: booking } = await db.collection('bookings').doc(bookingId).get()

    if (!booking) {
      return error(404, '预约不存在')
    }

    if (booking.userId !== OPENID) {
      return error(403, '只能取消自己的预约')
    }

    if (booking.status === 'cancelled') {
      return error(400, '预约已取消')
    }

    if (booking.status === 'completed') {
      return error(400, '已完成的预约无法取消')
    }

    if (booking.status === 'rejected') {
      return error(400, '已拒绝的预约无法取消')
    }

    if (booking.status === 'expired') {
      return error(400, '已超时的预约无法取消')
    }

    let deductScore = 0
    let newCredit = 100

    try {
      const { data: users } = await db.collection('users')
        .where({ openid: OPENID })
        .limit(1)
        .get()

      if (users && users.length > 0) {
        const currentCredit = users[0].creditScore || 100
        const bookingStartTime = new Date(`${booking.date}T${booking.startTime}:00+08:00`)
        const hoursUntilBooking = (bookingStartTime - new Date()) / (1000 * 60 * 60)
        let deductReason = ''

        if (hoursUntilBooking >= 6) {
          deductScore = 0
          deductReason = '取消预约（≥6小时前，免费取消）'
        } else if (hoursUntilBooking >= 3) {
          deductScore = 3
          deductReason = '取消预约（3-6小时前，扣3分）'
        } else if (hoursUntilBooking >= 1) {
          deductScore = 5
          deductReason = '取消预约（1-3小时前，扣5分）'
        } else {
          deductScore = 10
          deductReason = '取消预约（<1小时前，扣10分）'
        }

        newCredit = Math.max(0, currentCredit - deductScore)

        await db.collection('users').doc(users[0]._id).update({
          data: {
            creditScore: newCredit,
            updatedAt: db.serverDate()
          }
        })

        await db.collection('credit_records').add({
          data: {
            userId: users[0]._id,
            type: deductScore > 0 ? 'minus' : 'plus',
            scoreChange: -deductScore,
            currentScore: newCredit,
            reason: deductReason,
            relatedBookingId: bookingId,
            operatorId: 'system',
            createTime: db.serverDate()
          }
        })

        const { data: creditScores } = await db.collection('credit_scores')
          .where({ userId: users[0]._id })
          .limit(1)
          .get()

        if (creditScores && creditScores.length > 0) {
          await db.collection('credit_scores').doc(creditScores[0]._id).update({
            data: {
              currentScore: newCredit,
              totalMinus: _.inc(deductScore),
              updateTime: db.serverDate()
            }
          })
        }
      }
    } catch (creditErr) {
      console.error('[cancel] 信誉分处理失败:', creditErr)
    }

    await db.collection('bookings').doc(bookingId).update({
      data: {
        status: 'cancelled',
        updatedAt: db.serverDate()
      }
    })

    await restoreResources(booking.usedPublicResources)

    const message = deductScore > 0
      ? `预约已取消，扣除信誉分${deductScore}分`
      : '预约已取消，免费取消'

    return success({
      bookingId,
      status: 'cancelled',
      creditDeduct: deductScore,
      newCredit
    }, message)
  } catch (err) {
    console.error('[cancel] 取消预约失败:', err)
    return error(500, '取消预约失败')
  }
}
