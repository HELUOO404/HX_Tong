/**
 * @file 仪表盘数据处理器
 * @description 获取管理后台仪表盘统计数据和最近预约记录
 */

const { success, error } = require('../utils/response')

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

    const [usersData, roomsData] = await Promise.all([
      db.collection('users').where({ openid: _.in(userIds) }).get(),
      db.collection('rooms').where({ _id: _.in(roomIds) }).get()
    ])

    // 构建映射表
    const userMap = {}
    usersData.data.forEach(u => {
      userMap[u.openid] = u
    })

    const roomMap = {}
    roomsData.data.forEach(r => {
      roomMap[r._id] = r
    })

    // 组装最近预约数据
    const recentBookings = recentBookingsData.map(booking => ({
      _id: booking._id,
      roomId: booking.roomId,
      roomName: roomMap[booking.roomId]?.name || '未知会议室',
      userId: booking.userId,
      userName: userMap[booking.userId]?.name || userMap[booking.userId]?.realName || '未知用户',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      status: booking.status,
      createTime: booking.createTime || booking.createdAt
    }))

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
