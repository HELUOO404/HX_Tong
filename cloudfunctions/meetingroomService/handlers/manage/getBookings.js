const { success, error } = require('../../utils/response')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command

  try {
    const now = new Date()
    const cstOffset = 8 * 60 * 60 * 1000
    const cstNow = new Date(now.getTime() + cstOffset)
    const currentDate = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`
    const currentMinutes = cstNow.getUTCHours() * 60 + cstNow.getUTCMinutes()

    try {
      const { data: expiredBookings } = await db.collection('bookings')
        .where({
          date: _.lte(currentDate),
          status: _.in(['pending', 'approved'])
        })
        .limit(100)
        .get()

      for (const booking of expiredBookings) {
        if (booking.status === 'pending' && booking.startTime) {
          const startParts = booking.startTime.split(':')
          const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
          if (booking.date < currentDate || (booking.date === currentDate && currentMinutes >= startMin)) {
            await db.collection('bookings').doc(booking._id).update({
              data: { status: 'expired', updatedAt: db.serverDate() }
            })
          }
        } else if (booking.status === 'approved' && booking.endTime) {
          const endParts = booking.endTime.split(':')
          const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1])
          if (booking.date < currentDate || (booking.date === currentDate && currentMinutes >= endMin)) {
            await db.collection('bookings').doc(booking._id).update({
              data: { status: 'completed', updatedAt: db.serverDate() }
            })
          }
        }
      }
    } catch (e) {
      console.error('[getBookings] 更新过期预约失败:', e)
    }

    const {
      status,
      roomId,
      date,
      keyword,
      page = 1,
      pageSize = 20
    } = params

    const where = {}

    if (status) {
      where.status = status
    }

    if (roomId) {
      where.roomId = roomId
    }

    if (date) {
      where.date = date
    }

    if (keyword) {
      where.userName = db.RegExp({ regexp: keyword, options: 'i' })
    }

    const limit = parseInt(pageSize)
    const skip = (parseInt(page) - 1) * limit

    const { data: bookings } = await db.collection('bookings')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    const { total } = await db.collection('bookings')
      .where(where)
      .count()

    const userIds = [...new Set(bookings.map(b => b.userId).filter(Boolean))]
    const roomIds = [...new Set(bookings.map(b => b.roomId).filter(Boolean))]

    let userMap = {}
    if (userIds.length > 0) {
      const { data: users } = await db.collection('users')
        .where({
          openid: _.in(userIds)
        })
        .get()
      userMap = users.reduce((map, u) => {
        map[u.openid] = u
        return map
      }, {})
    }

    let roomMap = {}
    if (roomIds.length > 0) {
      const { data: rooms } = await db.collection('rooms')
        .where({
          _id: _.in(roomIds)
        })
        .get()
      roomMap = rooms.reduce((map, r) => {
        map[r._id] = r
        return map
      }, {})
    }

    const list = bookings.map(booking => {
      const user = userMap[booking.userId] || {}
      const room = roomMap[booking.roomId] || {}

      return {
        ...booking,
        userInfo: {
          nickname: user.nickname || '',
          remark: user.remark || '',
          realName: user.realName || '',
          name: user.nickname || user.realName || '',
          avatarUrl: user.avatarUrl || '',
          phone: user.phone || ''
        },
        roomInfo: {
          name: room.name || booking.roomName || '',
          location: room.location || ''
        }
      }
    })

    const cloudAvatarIndices = []
    const cloudFileIDs = []
    list.forEach((item, i) => {
      const url = item.userInfo && item.userInfo.avatarUrl
      if (url && url.startsWith('cloud://')) {
        cloudAvatarIndices.push(i)
        cloudFileIDs.push(url)
      }
    })
    if (cloudFileIDs.length > 0) {
      try {
        const tempResult = await cloud.getTempFileURL({ fileList: cloudFileIDs })
        if (tempResult.fileList) {
          tempResult.fileList.forEach((fileItem, i) => {
            if (fileItem.tempFileURL) {
              list[cloudAvatarIndices[i]].userInfo.avatarUrl = fileItem.tempFileURL
            }
          })
        }
      } catch (e) {
        console.warn('[getBookings] 头像临时URL转换失败:', e)
      }
    }

    return success({
      list,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('[getBookings] 获取预约列表失败:', err)
    return error(500, '获取预约列表失败')
  }
}
