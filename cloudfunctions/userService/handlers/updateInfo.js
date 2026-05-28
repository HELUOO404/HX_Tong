/**
 * @file 更新用户信息处理器
 * @description 更新当前登录用户的头像、昵称、备注
 */

const response = require('../utils/response')
const validator = require('../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  const allowedFields = ['avatarUrl', 'nickname', 'remark']
  const forbiddenFields = ['openid', 'role', 'status', 'creditScore', 'createdAt', '_id']

  try {
    for (const field of forbiddenFields) {
      if (params[field] !== undefined) {
        return response.error(403, `禁止更新字段: ${field}`)
      }
    }

    const updateData = {
      updateTime: db.serverDate()
    }

    for (const field of allowedFields) {
      if (params[field] !== undefined) {
        if (field === 'nickname') {
          const nicknameValidation = validator.validateNickname(params[field])
          if (!nicknameValidation.valid) {
            return response.error(400, nicknameValidation.message)
          }
          updateData.nickname = params[field].trim()
        } else if (field === 'remark') {
          const remarkValidation = validator.validateRemark(params[field])
          if (!remarkValidation.valid) {
            return response.error(400, remarkValidation.message)
          }
          updateData.remark = params[field].trim()
        } else {
          updateData[field] = params[field]
        }
      }
    }

    if (Object.keys(updateData).length <= 1) {
      return response.error(400, '没有需要更新的字段')
    }

    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const userId = users[0]._id

    await db.collection('users')
      .doc(userId)
      .update({ data: updateData })

    const { data: updatedUser } = await db.collection('users')
      .doc(userId)
      .get()

    let resolvedAvatarUrl = updatedUser.avatarUrl
    if (resolvedAvatarUrl && resolvedAvatarUrl.startsWith('cloud://')) {
      try {
        const tempResult = await cloud.getTempFileURL({
          fileList: [resolvedAvatarUrl]
        })
        if (tempResult.fileList && tempResult.fileList.length > 0 && tempResult.fileList[0].tempFileURL) {
          resolvedAvatarUrl = tempResult.fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[userService.updateInfo] 头像临时URL转换失败:', e)
        resolvedAvatarUrl = ''
      }
    }

    return response.success({
      _id: updatedUser._id,
      nickname: updatedUser.nickname || '',
      remark: updatedUser.remark || '',
      avatarUrl: resolvedAvatarUrl,
      profileCompleted: updatedUser.profileCompleted,
      updateTime: updatedUser.updateTime
    }, '更新成功')
  } catch (error) {
    console.error('[userService.updateInfo] 更新用户信息失败:', error)
    return response.error(500, '更新用户信息失败')
  }
}
