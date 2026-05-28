/**
 * @file 查看预约详情（会议安排查看员）
 */

const { success, error } = require('../../utils/response')
const permission = require('../../utils/permission')

async function hydratePermissionTags(db, permissionTags) {
  let tags = permissionTags || []
  const tagsNeedingPermissions = tags.filter(t => !t.permissions || Object.keys(t.permissions).length === 0)
  if (tagsNeedingPermissions.length === 0) return tags

  try {
    const { data: allTags } = await db.collection('permission_tags').get()
    const tagMap = {}
    allTags.forEach(t => {
      tagMap[t._id] = t
      if (t.tagId) tagMap[t.tagId] = t
    })
    tags = tags.map(tag => {
      if ((!tag.permissions || Object.keys(tag.permissions).length === 0) && tagMap[tag.tagId]) {
        return { ...tag, permissions: tagMap[tag.tagId].permissions || {} }
      }
      return tag
    })
  } catch (e) {
    console.error('[viewDetail] 权限标签水合失败:', e)
  }

  return tags
}

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command
  const { OPENID } = cloud.getWXContext()
  const { bookingId } = params

  if (!OPENID) {
    return error(401, '未登录')
  }

  if (!bookingId) {
    return error(400, '缺少预约ID')
  }

  try {
    const { data: users } = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (users.length === 0) {
      return error(403, '用户不存在')
    }

    const viewer = users[0]
    const permissionTags = await hydratePermissionTags(db, viewer.permissionTags)

    if (!permission.hasPermission(permissionTags, 'canViewBookingDetails')) {
      return error(403, '无查看预约详情权限')
    }

    const { data: booking } = await db.collection('bookings').doc(bookingId).get()
    if (!booking) {
      return error(404, '预约不存在')
    }

    let userInfo = {
      nickname: '',
      remark: '',
      realName: '',
      name: '',
      avatarUrl: '',
      phone: ''
    }
    let creditScore = 100

    if (booking.userId) {
      try {
        const { data: bookingUsers } = await db.collection('users')
          .where({ openid: booking.userId })
          .limit(1)
          .get()
        if (bookingUsers.length > 0) {
          const user = bookingUsers[0]
          userInfo = {
            nickname: user.nickname || '',
            remark: user.remark || '',
            realName: user.realName || '',
            name: user.nickname || user.realName || '',
            avatarUrl: user.avatarUrl || '',
            phone: user.phone || ''
          }
        }
      } catch (e) {
        console.error('[viewDetail] 获取预约人信息失败:', e)
      }

      try {
        const { data: creditRows } = await db.collection('credit_scores')
          .where({ userId: booking.userId })
          .limit(1)
          .get()
        if (creditRows.length > 0) {
          creditScore = creditRows[0].currentScore || creditRows[0].score || 100
        }
      } catch (e) {
        console.error('[viewDetail] 获取信誉分失败:', e)
      }
    }

    if (userInfo.avatarUrl && userInfo.avatarUrl.startsWith('cloud://')) {
      try {
        const tempResult = await cloud.getTempFileURL({ fileList: [userInfo.avatarUrl] })
        if (tempResult.fileList && tempResult.fileList[0] && tempResult.fileList[0].tempFileURL) {
          userInfo.avatarUrl = tempResult.fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[viewDetail] 头像临时URL转换失败:', e)
      }
    }

    let roomInfo = {
      name: booking.roomName || '',
      location: ''
    }
    if (booking.roomId) {
      try {
        const { data: room } = await db.collection('rooms').doc(booking.roomId).get()
        if (room) {
          roomInfo = {
            name: room.name || booking.roomName || '',
            location: room.location || '',
            capacity: room.capacity
          }
        }
      } catch (e) {
        console.error('[viewDetail] 获取会议室信息失败:', e)
      }
    }

    return success({
      booking: {
        ...booking,
        userInfo,
        roomInfo,
        creditScore
      }
    }, '获取成功')
  } catch (err) {
    console.error('[viewDetail] 获取预约详情失败:', err)
    return error(500, '获取预约详情失败')
  }
}
