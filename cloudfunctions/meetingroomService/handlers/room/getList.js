/**
 * @file 获取会议室列表处理器
 */

const { success, error } = require('../../utils/response')

module.exports = async (params, cloud) => {
  const db = cloud.database()

  try {
    const { isAdmin } = params

    let query = {}
    if (!isAdmin) {
      query.status = 'available'
    }

    let data
    try {
      const result = await db.collection('rooms')
        .where(query)
        .orderBy('sort', 'asc')
        .orderBy('createdAt', 'desc')
        .get()
      data = result.data || []
    } catch (sortErr) {
      const result = await db.collection('rooms')
        .where(query)
        .orderBy('createdAt', 'desc')
        .get()
      data = result.data || []
    }

    return success(data)
  } catch (err) {
    console.error('[getList] 获取会议室列表失败:', err)
    return error(500, '获取会议室列表失败')
  }
}
