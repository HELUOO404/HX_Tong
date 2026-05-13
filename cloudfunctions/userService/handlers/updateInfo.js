/**
 * @file 更新用户信息处理器
 * @description 更新当前登录用户的信息，支持更新：avatarUrl, phone等
 * 不能更新：openid, role, 信誉分等敏感字段
 */

const response = require('../utils/response')
const validator = require('../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  // 允许更新的字段白名单
  const allowedFields = ['avatarUrl', 'phone']
  
  // 禁止更新的敏感字段
  const forbiddenFields = ['openid', 'role', 'status', 'creditScore', 'createdAt', '_id']

  try {
    // 检查是否包含禁止更新的字段
    for (const field of forbiddenFields) {
      if (params[field] !== undefined) {
        return response.error(403, `禁止更新字段: ${field}`)
      }
    }

    // 构建更新数据
    const updateData = {
      updateTime: db.serverDate()
    }

    // 只处理允许的字段
    for (const field of allowedFields) {
      if (params[field] !== undefined) {
        // 手机号需要验证
        if (field === 'phone' && params[field]) {
          const phoneValidation = validator.validatePhone(params[field])
          if (!phoneValidation.valid) {
            return response.error(400, phoneValidation.message)
          }
        }
        updateData[field] = params[field]
      }
    }

    // 检查是否有可更新的字段
    if (Object.keys(updateData).length <= 1) {
      return response.error(400, '没有需要更新的字段')
    }

    // 查找用户
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const userId = users[0]._id

    // 更新用户信息
    await db.collection('users')
      .doc(userId)
      .update({ data: updateData })

    // 获取更新后的用户信息
    const { data: updatedUser } = await db.collection('users')
      .doc(userId)
      .get()

    return response.success({
      _id: updatedUser._id,
      avatarUrl: updatedUser.avatarUrl,
      phone: updatedUser.phone,
      updateTime: updatedUser.updateTime
    }, '更新成功')
  } catch (error) {
    console.error('[userService.updateInfo] 更新用户信息失败:', error)
    return response.error(500, '更新用户信息失败')
  }
}
