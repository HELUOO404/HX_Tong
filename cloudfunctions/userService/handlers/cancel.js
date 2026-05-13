/**
 * @file 用户取消注册处理器
 * @description 用户拒绝完善信息时，取消注册并删除用户数据
 */

const { success, error, forbidden } = require('../utils/response')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = cloud.database.command
  const { OPENID } = cloud.getWXContext()

  try {
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return error(404, '用户不存在，可能尚未注册')
    }

    const userId = users[0]._id

    await db.collection('users').doc(userId).remove()

    await db.collection('credit_scores')
      .where({ userId })
      .remove()

    const { data: creditRecords } = await db.collection('credit_records')
      .where({ userId })
      .limit(100)
      .get()

    for (const record of creditRecords) {
      await db.collection('credit_records').doc(record._id).remove()
    }

    console.log(`[user_cancel] 用户取消注册成功: ${OPENID}`)

    return success({
      cancelled: true,
      userId
    }, '取消注册成功')
  } catch (err) {
    console.error('[user_cancel] 取消注册失败:', err)
    return error(500, '取消注册失败: ' + err.message)
  }
}
