/**
 * @file 信誉分相关处理器
 * @description 获取当前信誉分和信誉分变动记录（支持分页）
 */

const response = require('../utils/response')

/**
 * 构建信誉分记录查询条件（兼容 openid / 用户 _id 两种历史写法）
 */
function buildCreditRecordQuery(db, user, openid) {
  const _ = db.command
  const ids = []
  if (user && user._id) ids.push(user._id)
  if (user && user.openid) ids.push(user.openid)
  if (openid) ids.push(openid)

  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (uniqueIds.length <= 1) {
    return { userId: uniqueIds[0] || (user && user._id) }
  }
  return _.or(uniqueIds.map(id => ({ userId: id })))
}

/**
 * 获取当前信誉分
 */
const getScore = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  try {
    // 先获取用户信息
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const user = users[0]
    const userId = user._id
    const scoreFromUsers = user.creditScore || 100

    // 获取信誉分信息
    const { data: creditScores } = await db.collection('credit_scores')
      .where({ userId })
      .limit(1)
      .get()

    if (creditScores.length === 0) {
      // 如果没有信誉分记录，创建默认记录
      const now = db.serverDate()
      await db.collection('credit_scores').add({
        data: {
          userId,
          currentScore: scoreFromUsers,
          baseScore: user.creditBase || 100,
          totalPlus: 0,
          totalMinus: 0,
          lastRestoreDate: now,
          createTime: now,
          updateTime: now
        }
      })

      return response.success({
        currentScore: scoreFromUsers,
        baseScore: user.creditBase || 100,
        totalPlus: 0,
        totalMinus: 0,
        userId
      }, '获取成功')
    }

    const creditInfo = creditScores[0]
    return response.success({
      currentScore: scoreFromUsers,
      baseScore: creditInfo.baseScore,
      totalPlus: creditInfo.totalPlus,
      totalMinus: creditInfo.totalMinus,
      lastRestoreDate: creditInfo.lastRestoreDate,
      userId: creditInfo.userId
    }, '获取成功')
  } catch (error) {
    console.error('[userService.credit.getScore] 获取信誉分失败:', error)
    return response.error(500, '获取信誉分失败')
  }
}

/**
 * 获取信誉分变动记录（支持分页）
 */
const getRecords = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()
  const { page = 1, pageSize = 20 } = params

  if (!OPENID) {
    return response.unauthorized()
  }

  // 验证分页参数
  const pageNum = parseInt(page, 10)
  const size = parseInt(pageSize, 10)
  if (isNaN(pageNum) || pageNum < 1) {
    return response.error(400, '页码必须大于0')
  }
  if (isNaN(size) || size < 1 || size > 100) {
    return response.error(400, '每页数量必须在1-100之间')
  }

  try {
    // 先获取用户信息
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const user = users[0]
    const recordQuery = buildCreditRecordQuery(db, user, OPENID)

    // 获取总数
    const { total } = await db.collection('credit_records')
      .where(recordQuery)
      .count()

    // 获取记录列表
    const { data: records } = await db.collection('credit_records')
      .where(recordQuery)
      .orderBy('createTime', 'desc')
      .skip((pageNum - 1) * size)
      .limit(size)
      .get()

    return response.success({
      list: records.map(record => ({
        _id: record._id,
        type: record.type,
        scoreChange: record.scoreChange !== undefined ? record.scoreChange : (record.score || 0),
        currentScore: record.currentScore,
        reason: record.reason,
        relatedBookingId: record.relatedBookingId,
        createTime: record.createTime || record.createdAt
      })),
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    }, '获取成功')
  } catch (error) {
    console.error('[userService.credit.getRecords] 获取信誉分记录失败:', error)
    return response.error(500, '获取信誉分记录失败')
  }
}

module.exports = {
  getScore,
  getRecords
}
