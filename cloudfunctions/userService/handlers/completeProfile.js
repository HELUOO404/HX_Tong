/**
 * @file 完善用户信息处理器
 * @description 首次登录时完善用户信息，包含字段验证和自动标签分配
 */

const response = require('../utils/response')
const validator = require('../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  const { realName, className, studentId, phone, academy, avatarUrl } = params

  const requiredValidation = validator.validateRequired(params, ['realName', 'className', 'studentId', 'phone', 'academy'])
  if (!requiredValidation.valid) {
    return response.error(400, requiredValidation.message)
  }

  const realNameValidation = validator.validateRealName(realName)
  if (!realNameValidation.valid) {
    return response.error(400, realNameValidation.message)
  }

  const studentIdValidation = validator.validateStudentId(studentId)
  if (!studentIdValidation.valid) {
    return response.error(400, studentIdValidation.message)
  }

  const phoneValidation = validator.validatePhone(phone)
  if (!phoneValidation.valid) {
    return response.error(400, phoneValidation.message)
  }

  try {
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const userId = users[0]._id
    let permissionTags = users[0].permissionTags || []

    /* v5.8: 不再自动生成学院/班级标签
    const academyTag = await createOrGetTag(db, academy, 'academy')
    if (!permissionTags.find(t => t.tagId === academyTag._id)) {
      permissionTags.push({
        tagId: academyTag._id,
        tagName: academy
      })
    }

    const classTag = await createOrGetTag(db, className, 'class')
    if (!permissionTags.find(t => t.tagId === classTag._id)) {
      permissionTags.push({
        tagId: classTag._id,
        tagName: className
      })
    }
    */

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          realName,
          className,
          studentId,
          phone,
          academy,
          avatarUrl: avatarUrl || users[0].avatarUrl,
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

    let avatarUrl = updatedUser.avatarUrl
    if (avatarUrl && avatarUrl.startsWith('cloud://')) {
      try {
        const tempResult = await cloud.getTempFileURL({
          fileList: [avatarUrl]
        })
        if (tempResult.fileList && tempResult.fileList.length > 0 && tempResult.fileList[0].tempFileURL) {
          avatarUrl = tempResult.fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[userService.completeProfile] 头像临时URL转换失败:', e)
        avatarUrl = ''
      }
    }

    return response.success({
      _id: updatedUser._id,
      realName: updatedUser.realName,
      className: updatedUser.className,
      studentId: updatedUser.studentId,
      academy: updatedUser.academy,
      phone: updatedUser.phone,
      avatarUrl: avatarUrl,
      permissionTags: updatedUser.permissionTags,
      profileCompleted: updatedUser.profileCompleted,
      updateTime: updatedUser.updateTime
    }, '完善信息成功')
  } catch (error) {
    console.error('[userService.completeProfile] 完善信息失败:', error)
    return response.error(500, '完善信息失败')
  }
}

async function createOrGetTag(db, name, type) {
  const { data: existing } = await db.collection('permission_tags')
    .where({ name, type })
    .limit(1)
    .get()

  if (existing.length > 0) {
    return existing[0]
  }

  const result = await db.collection('permission_tags').add({
    data: {
      name,
      type,
      description: `${type === 'academy' ? '学院' : '班级'}标签`,
      permissions: {},
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })

  return { _id: result._id, name, type }
}