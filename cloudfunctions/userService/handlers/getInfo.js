/**
 * @file 获取用户信息处理器
 * @description 获取当前登录用户的完整信息，包含信誉分
 */

const response = require('../utils/response')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return response.unauthorized()
  }

  try {
    // 获取用户信息
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return response.notFound('用户')
    }

    const userInfo = users[0]

    let avatarUrl = userInfo.avatarUrl
    if (avatarUrl && avatarUrl.startsWith('cloud://')) {
      try {
        const tempResult = await cloud.getTempFileURL({
          fileList: [avatarUrl]
        })
        if (tempResult.fileList && tempResult.fileList.length > 0 && tempResult.fileList[0].tempFileURL) {
          avatarUrl = tempResult.fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[userService.getInfo] 头像临时URL转换失败:', e)
        avatarUrl = ''
      }
    }

    // 获取信誉分信息
    const { data: creditScores } = await db.collection('credit_scores')
      .where({ userId: userInfo._id })
      .limit(1)
      .get()

    const creditInfo = creditScores.length > 0 ? creditScores[0] : {
      currentScore: userInfo.creditScore || 100,
      baseScore: 100,
      totalPlus: 0,
      totalMinus: 0
    }

    return response.success({
      _id: userInfo._id,
      openid: userInfo.openid,
      avatarUrl: avatarUrl,
      nickname: userInfo.nickname || '',
      remark: userInfo.remark || '',
      realName: userInfo.realName,
      className: userInfo.className,
      studentId: userInfo.studentId,
      phone: userInfo.phone,
      role: userInfo.role,
      status: userInfo.status,
      profileCompleted: userInfo.profileCompleted,
      academy: userInfo.academy || '',
      permissionTags: userInfo.permissionTags || [],
      creditScore: userInfo.creditScore || creditInfo.currentScore || 100,
      creditInfo: {
        currentScore: userInfo.creditScore || creditInfo.currentScore || 100,
        baseScore: creditInfo.baseScore,
        totalPlus: creditInfo.totalPlus,
        totalMinus: creditInfo.totalMinus
      },
      createTime: userInfo.createTime || userInfo.createdAt,
      updateTime: userInfo.updateTime || userInfo.updatedAt,
      lastLoginAt: userInfo.lastLoginAt
    }, '获取成功')
  } catch (error) {
    console.error('[userService.getInfo] 获取用户信息失败:', error)
    return response.error(500, '获取用户信息失败')
  }
}
