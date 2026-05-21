const { success, error, notFound } = require('../utils/response')

const DEFAULT_AVATAR = '/assets/images/logo.png'
const MAX_SCORE = 150

async function findUserByUserId(db, userId) {
  if (!userId) return null

  const { data: byOpenid } = await db.collection('users')
    .where({ openid: userId })
    .limit(1)
    .get()
  if (byOpenid.length > 0) return byOpenid[0]

  const { data: byLegacyOpenid } = await db.collection('users')
    .where({ _openid: userId })
    .limit(1)
    .get()
  if (byLegacyOpenid.length > 0) return byLegacyOpenid[0]

  try {
    const { data: byDocId } = await db.collection('users').doc(userId).get()
    if (byDocId) return byDocId
  } catch (e) {
    // ignore invalid doc id
  }

  return null
}

function getUserOpenid(user) {
  return user.openid || user._openid || ''
}

async function getFilterOptions(params, cloud) {
  const db = cloud.database()
  const _ = db.command

  try {
    const { list: academyList } = await db.collection('users')
      .aggregate()
      .match({ academy: _.exists(true) })
      .group({ _id: '$academy' })
      .project({ _id: 0, name: '$_id' })
      .end()

    const { list: classList } = await db.collection('users')
      .aggregate()
      .match({ className: _.exists(true) })
      .group({ _id: '$className' })
      .project({ _id: 0, name: '$_id' })
      .end()

    return success({
      academies: academyList.map(a => a.name).filter(Boolean),
      classes: classList.map(c => c.name).filter(Boolean)
    })
  } catch (err) {
    console.error('[adminService.users.getFilterOptions] 获取筛选选项失败:', err)
    return error(500, '获取筛选选项失败: ' + err.message)
  }
}

async function getList(params, cloud) {
  const db = cloud.database()
  const _ = db.command
  const admin = params._admin
  const { page = 1, pageSize = 20, role, keyword, tagFilter, academy, className, minCredit, maxCredit, profileCompleted } = params

  try {
    let query = {}

    if (tagFilter && tagFilter !== 'all') {
      query['permissionTags.tagId'] = tagFilter
    }

    if (role) {
      query.role = role
    }

    if (academy && academy.trim()) {
      query.academy = db.RegExp({ regexp: academy.trim(), options: 'i' })
    }

    if (className && className.trim()) {
      query.className = db.RegExp({ regexp: className.trim(), options: 'i' })
    }

    if (keyword && keyword.trim()) {
      const searchKey = keyword.trim()
      query.$or = [
        { nickname: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { remark: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { realName: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { phone: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { studentId: db.RegExp({ regexp: searchKey, options: 'i' }) }
      ]
    }

    if (minCredit !== undefined && minCredit !== '' && maxCredit !== undefined && maxCredit !== '') {
      query.creditScore = _.and(_.gte(Number(minCredit)), _.lte(Number(maxCredit)))
    } else if (minCredit !== undefined && minCredit !== '') {
      query.creditScore = _.gte(Number(minCredit))
    } else if (maxCredit !== undefined && maxCredit !== '') {
      query.creditScore = _.lte(Number(maxCredit))
    }

    if (profileCompleted !== undefined && profileCompleted !== '') {
      query.profileCompleted = profileCompleted === 'true' || profileCompleted === true
    }

    const countResult = await db.collection('users').where(query).count()
    const total = countResult.total

    const { data: usersData } = await db.collection('users')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const users = usersData.map(user => ({
      _id: user._id,
      _openid: user._openid,
      openid: user.openid || user._openid || '',
      name: user.nickname || user.realName || user.name || '',
      nickname: user.nickname || '',
      remark: user.remark || '',
      realName: user.realName || '',
      avatarUrl: user.avatarUrl || '',
      phone: user.phone || '',
      studentId: user.studentId || '',
      className: user.className || '',
      academy: user.academy || '',
      role: user.role || 'user',
      permissionTags: user.permissionTags || [],
      creditScore: user.creditScore || 100,
      profileCompleted: user.profileCompleted || false,
      createTime: user.createTime,
      updateTime: user.updateTime
    }))

    const cloudAvatarIndices = []
    const cloudFileIDs = []
    users.forEach((u, i) => {
      if (u.avatarUrl && u.avatarUrl.startsWith('cloud://')) {
        cloudAvatarIndices.push(i)
        cloudFileIDs.push(u.avatarUrl)
      }
    })
    if (cloudFileIDs.length > 0) {
      try {
        const tempResult = await cloud.getTempFileURL({ fileList: cloudFileIDs })
        if (tempResult.fileList) {
          tempResult.fileList.forEach((item, i) => {
            if (item.tempFileURL) {
              users[cloudAvatarIndices[i]].avatarUrl = item.tempFileURL
            }
          })
        }
      } catch (e) {
        console.warn('[adminService.users.getList] 头像临时URL转换失败:', e)
      }
    }

    return success({
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }, '获取成功')
  } catch (err) {
    console.error('[adminService.users.getList] 获取用户列表失败:', err)
    return error(500, '获取用户列表失败: ' + err.message)
  }
}

async function updateUser(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, name, realName, nickname, remark, avatarUrl, phone, studentId, className, academy } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    const user = await findUserByUserId(db, userId)
    if (!user) {
      return notFound('用户')
    }

    const updateData = { updateTime: db.serverDate() }

    if (name !== undefined) updateData.name = name
    if (realName !== undefined) updateData.realName = realName
    if (nickname !== undefined) updateData.nickname = nickname
    if (remark !== undefined) updateData.remark = remark
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (phone !== undefined) updateData.phone = phone
    if (studentId !== undefined) updateData.studentId = studentId
    if (className !== undefined) updateData.className = className
    if (academy !== undefined) updateData.academy = academy

    await db.collection('users')
      .doc(user._id)
      .update({ data: updateData })

    return success({ userId, updateTime: new Date().toISOString() }, '用户信息更新成功')
  } catch (err) {
    console.error('[adminService.users.updateUser] 更新用户信息失败:', err)
    return error(500, '更新用户信息失败: ' + err.message)
  }
}

async function deleteUser(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const _ = db.command
  const { userId } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    const user = await findUserByUserId(db, userId)
    if (!user) {
      return notFound('用户')
    }

    const openid = getUserOpenid(user)
    if (openid && admin.openid && openid === admin.openid) {
      return error(400, '不能删除自己')
    }

    await db.collection('users').doc(user._id).remove()

    if (openid) {
      await db.collection('bookings').where({ userId: openid }).remove()
    }

    await db.collection('credit_records').where(
      _.or([
        { userId: user._id },
        ...(openid ? [{ userId: openid }] : [])
      ])
    ).remove()

    await db.collection('credit_scores').where(
      _.or([
        { userId: user._id },
        ...(openid ? [{ userId: openid }] : [])
      ])
    ).remove()

    return success({ userId: openid || user._id }, '删除成功')
  } catch (err) {
    console.error('[adminService.users.deleteUser] 删除用户失败:', err)
    return error(500, '删除用户失败: ' + err.message)
  }
}

async function resetAvatar(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    const user = await findUserByUserId(db, userId)
    if (!user) {
      return notFound('用户')
    }

    await db.collection('users')
      .doc(user._id)
      .update({
        data: {
          avatarUrl: DEFAULT_AVATAR,
          updateTime: db.serverDate()
        }
      })

    return success({ userId: getUserOpenid(user) || user._id, avatarUrl: DEFAULT_AVATAR }, '头像重置成功')
  } catch (err) {
    console.error('[adminService.users.resetAvatar] 重置头像失败:', err)
    return error(500, '重置头像失败: ' + err.message)
  }
}

async function updateRole(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, role } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    const { data: userData } = await db.collection('users')
      .where({ openid: userId })
      .limit(1)
      .get()

    if (userData.length === 0) {
      return notFound('用户')
    }

    const user = userData[0]

    await db.collection('users')
      .doc(user._id)
      .update({
        data: {
          role,
          updateTime: db.serverDate()
        }
      })

    return success({ userId, role, updateTime: new Date().toISOString() }, '角色更新成功')
  } catch (err) {
    console.error('[adminService.users.updateRole] 更新角色失败:', err)
    return error(500, '更新角色失败: ' + err.message)
  }
}

async function updatePermission(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, permissions } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    const { data: userData } = await db.collection('users')
      .where({ openid: userId })
      .limit(1)
      .get()

    if (userData.length === 0) {
      return notFound('用户')
    }

    const user = userData[0]

    const updateData = { updateTime: db.serverDate() }
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return error(400, '权限列表必须是数组')
      }
      updateData.permissions = permissions
    }

    await db.collection('users')
      .doc(user._id)
      .update({ data: updateData })

    return success({ userId, permissions, updateTime: new Date().toISOString() }, '权限更新成功')
  } catch (err) {
    console.error('[adminService.users.updatePermission] 更新用户权限失败:', err)
    return error(500, '更新用户权限失败: ' + err.message)
  }
}

async function updatePermissionTags(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, permissionTags } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  if (!permissionTags || !Array.isArray(permissionTags)) {
    return error(400, '权限标签必须是数组')
  }

  try {
    const { data: userData } = await db.collection('users')
      .where({ openid: userId })
      .limit(1)
      .get()

    if (userData.length === 0) {
      return notFound('用户')
    }

    const user = userData[0]

    const seenTagIds = new Set()
    const dedupedTags = []
    for (const tag of permissionTags) {
      const key = tag.tagId || tag._id
      if (key && !seenTagIds.has(key)) {
        seenTagIds.add(key)
        dedupedTags.push(tag)
      }
    }

    await db.collection('users')
      .doc(user._id)
      .update({
        data: {
          permissionTags: dedupedTags,
          updateTime: db.serverDate()
        }
      })

    return success({ userId, permissionTags: dedupedTags, updateTime: new Date().toISOString() }, '权限标签更新成功')
  } catch (err) {
    console.error('[adminService.users.updatePermissionTags] 更新权限标签失败:', err)
    return error(500, '更新权限标签失败: ' + err.message)
  }
}

async function getUserBookings(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, page = 1, pageSize = 20, status } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  try {
    let query = { userId: userId }
    if (status && ['pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(status)) {
      query.status = status
    }

    const countResult = await db.collection('bookings').where(query).count()
    const total = countResult.total

    const { data: bookings } = await db.collection('bookings')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      roomId: booking.roomId,
      roomName: booking.roomName || '',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      purpose: booking.purpose,
      attendees: booking.attendees,
      contactPhone: booking.contactPhone,
      status: booking.status,
      createTime: booking.createTime || booking.createdAt,
      rejectReason: booking.rejectReason || ''
    }))

    return success({
      list: formattedBookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }, '获取成功')
  } catch (err) {
    console.error('[adminService.users.getUserBookings] 获取用户预约列表失败:', err)
    return error(500, '获取用户预约列表失败: ' + err.message)
  }
}

async function updateCredit(params, cloud) {
  const db = cloud.database()
  const admin = params._admin
  const { userId, scoreChange, reason } = params

  if (!userId) {
    return error(400, '缺少用户ID')
  }

  if (scoreChange === undefined || scoreChange === null) {
    return error(400, '缺少分数变动值')
  }

  if (!reason || !reason.trim()) {
    return error(400, '请输入变动原因')
  }

  try {
    const user = await findUserByUserId(db, userId)
    if (!user) {
      return notFound('用户')
    }

    const openid = getUserOpenid(user)
    const currentScore = user.creditScore || 100
    let newScore = currentScore + parseInt(scoreChange)
    newScore = Math.max(0, Math.min(MAX_SCORE, newScore))

    await db.collection('users')
      .doc(user._id)
      .update({
        data: {
          creditScore: newScore,
          updateTime: db.serverDate()
        }
      })

    const scoreChangeNum = parseInt(scoreChange)
    const { data: creditScores } = await db.collection('credit_scores')
      .where({ userId: user._id })
      .limit(1)
      .get()

    if (creditScores && creditScores.length > 0) {
      const updateData = {
        currentScore: newScore,
        updateTime: db.serverDate()
      }
      if (scoreChangeNum >= 0) {
        updateData.totalPlus = db.command.inc(scoreChangeNum)
      } else {
        updateData.totalMinus = db.command.inc(Math.abs(scoreChangeNum))
      }
      await db.collection('credit_scores').doc(creditScores[0]._id).update({
        data: updateData
      })
    } else {
      await db.collection('credit_scores').add({
        data: {
          userId: user._id,
          currentScore: newScore,
          baseScore: user.creditBase || 100,
          totalPlus: scoreChangeNum >= 0 ? scoreChangeNum : 0,
          totalMinus: scoreChangeNum < 0 ? Math.abs(scoreChangeNum) : 0,
          lastRestoreDate: db.serverDate(),
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    await db.collection('credit_records').add({
      data: {
        userId: user._id,
        type: scoreChangeNum >= 0 ? 'plus' : 'minus',
        scoreChange: scoreChangeNum,
        currentScore: newScore,
        reason: reason.trim(),
        source: 'admin',
        operatorId: admin._id,
        createTime: db.serverDate()
      }
    })

    return success({
      userId: openid || user._id,
      previousScore: currentScore,
      newScore: newScore,
      change: scoreChangeNum
    }, '信誉分更新成功')
  } catch (err) {
    console.error('[adminService.users.updateCredit] 更新信誉分失败:', err)
    return error(500, '更新信誉分失败: ' + err.message)
  }
}

module.exports = {
  getFilterOptions,
  getList,
  updateUser,
  deleteUser,
  resetAvatar,
  updateRole,
  updatePermission,
  updatePermissionTags,
  getUserBookings,
  updateCredit
}
