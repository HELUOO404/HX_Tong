/**
 * @file 仪表盘数据处理器
 * @description 获取管理后台仪表盘统计数据和最近预约记录
 */

const { success, error } = require('../utils/response')

function addUserToMap(userMap, user) {
  if (!user) return
  if (user.openid) userMap[user.openid] = user
  if (user._openid) userMap[user._openid] = user
  if (user._id) userMap[user._id] = user
}

async function buildUserMap(db, _, userIds) {
  const userMap = {}
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return userMap

  const results = await Promise.all([
    db.collection('users').where({ openid: _.in(ids) }).get(),
    db.collection('users').where({ _openid: _.in(ids) }).get()
  ])

  try {
    const byDocId = await db.collection('users').where({ _id: _.in(ids) }).get()
    results.push(byDocId)
  } catch (e) {
    console.warn('[dashboard] 按 _id 查询用户跳过:', e.message)
  }
  results.forEach(({ data }) => {
    data.forEach((user) => addUserToMap(userMap, user))
  })

  return userMap
}

function getUserForBooking(booking, userMap) {
  return userMap[booking.userId] || null
}

function resolveNickname(booking, user) {
  const stored = booking.userName && String(booking.userName).trim()
  if (stored) return stored
  if (!user) return '未知用户'
  return user.nickname || user.realName || user.name || '未知用户'
}

async function resolveCloudAvatars(cloud, list) {
  const cloudIds = []
  const indices = []
  list.forEach((item, i) => {
    if (item.avatarUrl && item.avatarUrl.startsWith('cloud://')) {
      cloudIds.push(item.avatarUrl)
      indices.push(i)
    }
  })
  if (cloudIds.length === 0) return list

  try {
    const tempResult = await cloud.getTempFileURL({ fileList: cloudIds })
    if (tempResult.fileList) {
      tempResult.fileList.forEach((fileItem, i) => {
        if (fileItem.tempFileURL && indices[i] !== undefined) {
          list[indices[i]].avatarUrl = fileItem.tempFileURL
        }
      })
    }
  } catch (e) {
    console.warn('[dashboard] 头像临时链接获取失败:', e.message)
  }
  return list
}

/**
 * 获取仪表盘数据
 * @param {Object} params - 请求参数
 * @param {Object} cloud - 云开发实例
 * @returns {Object} 仪表盘数据
 */
async function getDashboard(params, cloud) {
  const db = cloud.database()
  const _ = db.command

  try {
    // 获取今日日期
    const today = new Date().toISOString().split('T')[0]

    // 并行获取统计数据
    const [
      userCount,
      roomCount,
      bookingTotal,
      bookingPending,
      bookingToday
    ] = await Promise.all([
      // 总用户数
      db.collection('users').count(),
      // 总会议室数
      db.collection('rooms').count(),
      // 预约总数
      db.collection('bookings').count(),
      // 待审批预约数
      db.collection('bookings').where({ status: 'pending' }).count(),
      // 今日预约数
      db.collection('bookings').where({
        date: today,
        status: _.in(['approved', 'completed'])
      }).count()
    ])

    // 获取最近预约记录（10条）
    const { data: recentBookingsData } = await db.collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    // 获取关联的用户和会议室数据
    const userIds = [...new Set(recentBookingsData.map(b => b.userId))]
    const roomIds = [...new Set(recentBookingsData.map(b => b.roomId))]

    const [userMap, roomsData] = await Promise.all([
      buildUserMap(db, _, userIds),
      roomIds.length > 0
        ? db.collection('rooms').where({ _id: _.in(roomIds) }).get()
        : Promise.resolve({ data: [] })
    ])

    const roomMap = {}
    roomsData.data.forEach(r => {
      roomMap[r._id] = r
    })

    // 组装最近预约数据
    let recentBookings = recentBookingsData.map((booking) => {
      const user = getUserForBooking(booking, userMap)
      const remark = (user && user.remark) ? String(user.remark).trim() : ''
      const attendees = booking.attendees
      return {
        _id: booking._id,
        roomId: booking.roomId,
        roomName: roomMap[booking.roomId]?.name || booking.roomName || '未知会议室',
        userId: booking.userId,
        userName: resolveNickname(booking, user),
        nickname: resolveNickname(booking, user),
        remark,
        avatarUrl: (user && user.avatarUrl) || '',
        purpose: booking.purpose || '',
        attendees: attendees !== undefined && attendees !== null && attendees !== '' ? attendees : '',
        contactPhone: booking.contactPhone || '',
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timeText: booking.date && booking.startTime && booking.endTime
          ? `${booking.date} ${booking.startTime}-${booking.endTime}`
          : (booking.date || ''),
        status: booking.status,
        createTime: booking.createTime || booking.createdAt
      }
    })

    recentBookings = await resolveCloudAvatars(cloud, recentBookings)

    return success({
      stats: {
        totalUsers: userCount.total,
        totalRooms: roomCount.total,
        totalBookings: bookingTotal.total,
        pendingApprovals: bookingPending.total,
        todayBookings: bookingToday.total
      },
      recentBookings
    }, '获取成功')
  } catch (err) {
    console.error('[adminService.dashboard] 获取仪表盘数据失败:', err)
    return error(500, '获取仪表盘数据失败: ' + err.message)
  }
}

module.exports = { getDashboard }
