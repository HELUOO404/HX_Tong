/**
 * @file 获取会议室详情处理器
 */

const { success, error, notFound } = require('../../utils/response')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()

  // 参数校验
  const check = validateRequired(params, ['roomId'])
  if (!check.valid) return error(400, check.message)

  const { roomId } = params

  try {
    const { data } = await db.collection('rooms').doc(roomId).get()

    if (!data) {
      return notFound('会议室')
    }

    return success(data, '获取会议室详情成功')
  } catch (err) {
    return error(500, '获取会议室详情失败')
  }
}
