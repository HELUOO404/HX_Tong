/**
 * @file 用户登录处理器
 * @description 处理微信登录，获取openid，创建/查询用户
 */

const response = require('../utils/response')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const usersCollection = db.collection('users')
  const creditScoresCollection = db.collection('credit_scores')

  try {
    // 获取openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (!openid) {
      return response.error(4002, '获取微信用户信息失败')
    }

    // 查询用户是否已存在
    const { data: existingUsers } = await usersCollection
      .where({ openid })
      .limit(1)
      .get()

    let userInfo
    let isNewUser = false

    if (existingUsers.length > 0) {
      // 已存在，更新登录时间
      userInfo = existingUsers[0]
      await usersCollection.doc(userInfo._id).update({
        data: {
          lastLoginAt: db.serverDate(),
          updateTime: db.serverDate()
        }
      })

      if (userInfo.creditScore === undefined) {
        userInfo.creditScore = 100
      }
    } else {
      // 新用户，创建用户记录
      isNewUser = true
      const newUser = {
        openid,
        avatarUrl: '',
        realName: '',
        className: '',
        studentId: '',
        phone: '',
        academy: '',
        role: 'user',
        status: 0,
        profileCompleted: false,
        permissionTags: [],
        creditScore: 100,
        creditBase: 100,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        lastLoginAt: db.serverDate()
      }

      const { _id } = await usersCollection.add({ data: newUser })
      userInfo = { ...newUser, _id }

      // 初始化信誉分
      await creditScoresCollection.add({
        data: {
          userId: _id,
          currentScore: 100,
          baseScore: 100,
          totalPlus: 0,
          totalMinus: 0,
          lastRestoreDate: db.serverDate(),
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

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
        console.warn('[userService.login] 头像临时URL转换失败:', e)
        avatarUrl = ''
      }
    }

    return response.success({
      userInfo: {
        _id: userInfo._id,
        openid: userInfo.openid,
        avatarUrl: avatarUrl,
        realName: userInfo.realName,
        className: userInfo.className,
        studentId: userInfo.studentId,
        phone: userInfo.phone,
        role: userInfo.role,
        status: userInfo.status,
        profileCompleted: userInfo.profileCompleted,
        academy: userInfo.academy || '',
        permissionTags: userInfo.permissionTags || [],
        creditScore: userInfo.creditScore || 100,
        isNewUser
      },
      token: openid
    }, '登录成功')
  } catch (error) {
    console.error('[userService.login] 登录失败:', error)
    return response.error(500, '登录失败，请稍后重试')
  }
}
