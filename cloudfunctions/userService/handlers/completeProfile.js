/**
 * @file 完善用户信息处理器
 * @description 首次登录时完善用户信息
 */

const response = require('../utils/response')
const validator = require('../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  const { nickname, remark, avatarUrl } = params

  const requiredValidation = validator.validateRequired(params, ['nickname'])
  if (!requiredValidation.valid) {
    return response.error(400, requiredValidation.message)
  }

  const nicknameValidation = validator.validateNickname(nickname)
  if (!nicknameValidation.valid) {
    return response.error(400, nicknameValidation.message)
  }

  const remarkValidation = validator.validateRemark(remark)
  if (!remarkValidation.valid) {
    return response.error(400, remarkValidation.message)
  }

  const trimmedRemark = (remark || '').trim()

  try {
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const userId = users[0]._id
    const permissionTags = users[0].permissionTags || []

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          nickname: nickname.trim(),
          remark: trimmedRemark,
          avatarUrl: avatarUrl || users[0].avatarUrl || '',
          permissionTags,
          profileCompleted: true,
          creditScore: users[0].creditScore || 100,
          creditBase: users[0].creditBase || 100,
          updateTime: db.serverDate()
        }
      })

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
        console.warn('[userService.completeProfile] 头像临时URL转换失败:', e)
        resolvedAvatarUrl = ''
      }
    }

    return response.success({
      _id: updatedUser._id,
      nickname: updatedUser.nickname,
      remark: updatedUser.remark,
      avatarUrl: resolvedAvatarUrl,
      permissionTags: updatedUser.permissionTags,
      profileCompleted: updatedUser.profileCompleted,
      updateTime: updatedUser.updateTime
    }, '完善信息成功')
  } catch (error) {
    console.error('[userService.completeProfile] 完善信息失败:', error)
    return response.error(500, '完善信息失败')
  }
}
