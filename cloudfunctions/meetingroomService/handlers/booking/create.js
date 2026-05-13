/**
 * @file 创建预约处理器
 */

const { success, error } = require('../../utils/response')
const { validateRequired, validateTimeRange } = require('../../utils/validator')
const { deductResources, checkResourceAvailability } = require('../../shared/resourceManager')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return error(401, '用户未登录，请先登录')
  }

  let user
  try {
    const result = await db.collection('users').where({ openid: OPENID }).limit(1).get()
    if (!result.data || result.data.length === 0) {
      return error(401, '用户不存在，请先注册')
    }
    user = result.data[0]
  } catch (err) {
    console.error('[BookingCreate] 验证用户失败:', err)
    return error(500, '验证用户信息失败')
  }

  const required = ['roomId', 'date', 'startTime', 'endTime', 'purpose', 'attendees', 'contactPhone']
  const check = validateRequired(params, required)
  if (!check.valid) return error(400, check.message)

  const { roomId, date, startTime, endTime, purpose, attendees, contactPhone, usedPublicResources } = params

  if (attendees === undefined || attendees === null || !Number.isFinite(attendees) || attendees <= 0) {
    return error(400, '参与人数必须大于0')
  }

  if (contactPhone && !/^1[3-9]\d{9}$/.test(contactPhone)) {
    return error(400, '手机号格式不正确')
  }

  const timeCheck = validateTimeRange(startTime, endTime)
  if (!timeCheck.valid) return error(400, timeCheck.message)

  const now = new Date()
  const cstOffset = 8 * 60 * 60 * 1000
  const cstNow = new Date(now.getTime() + cstOffset)
  const bookingDateTime = new Date(`${date}T${startTime}:00+08:00`)

  if (isNaN(bookingDateTime.getTime())) {
    return error(400, '预约日期或时间格式不正确')
  }

  if (bookingDateTime < now) {
    return error(400, '不能预约过去的时间段')
  }

  const todayStr = `${cstNow.getUTCFullYear()}-${String(cstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(cstNow.getUTCDate()).padStart(2, '0')}`
  if (date < todayStr) {
    return error(400, '不能预约昨天及以前的日期')
  }

  const creditScore = user.creditScore || 100
  if (creditScore < 80) {
    return error(400, '您的信誉分低于80分，暂无法预约')
  }

  const start = new Date(`${date}T${startTime}+08:00`)
  const end = new Date(`${date}T${endTime}+08:00`)
  const duration = (end - start) / (1000 * 60 * 60)

  if (isNaN(duration) || duration <= 0) {
    return error(400, '预约时间格式不正确')
  }

  if (duration * 60 < 30) {
    return error(400, '预约时长至少30分钟')
  }

  const { data: conflicts } = await db.collection('bookings')
    .where({
      roomId,
      date,
      status: _.in(['pending', 'approved']),
      startTime: _.lt(endTime),
      endTime: _.gt(startTime)
    })
    .get()

  if (conflicts.length > 0) {
    return error(1001, '该时间段已被预约，请选择其他时段')
  }

  let room = null
  try {
    const result = await db.collection('rooms').doc(roomId).get()
    room = result.data
  } catch (e) {
    return error(404, '会议室不存在')
  }

  if (!room) {
    return error(404, '会议室不存在')
  }

  if (room.status !== 'available') {
    return error(400, '该会议室当前不可预约')
  }

  if (startTime < (room.openTime || '00:00') || endTime > (room.closeTime || '24:00')) {
    return error(400, `预约时间需在会议室开放时段内（${room.openTime || '00:00'}-${room.closeTime || '24:00'}）`)
  }

  const bookingDateObj = new Date(date + 'T00:00:00+08:00')
  const todayDateObj = new Date(new Date().toLocaleDateString('zh-CN') + 'T00:00:00+08:00')
  const daysDiff = Math.floor((bookingDateObj - todayDateObj) / (1000 * 60 * 60 * 24))

  if (room.minAdvanceDays && room.minAdvanceDays > 0 && daysDiff < room.minAdvanceDays) {
    return error(400, `该会议室需至少提前${room.minAdvanceDays}天预约`)
  }
  if (room.maxAdvanceDays && room.maxAdvanceDays > 0 && daysDiff > room.maxAdvanceDays) {
    return error(400, `该会议室最多提前${room.maxAdvanceDays}天预约`)
  }

  let matchedRule = null
  let needApproval = true  // 默认全部需要手动审批

  try {
    const { data: rules } = await db.collection('approval_rules')
      .where({
        enabled: true,
        type: _.in(['global', 'meetingroom'])
      })
      .orderBy('priority', 'desc')
      .get()

    const bookingHour = parseInt(startTime.split(':')[0])
    const startForDayCalc = new Date(`${date}T${startTime}+08:00`)
    const dayOfWeek = startForDayCalc.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    let timeSlot = 'weekday'
    let timeSlotDetail = ''
    if (isWeekend) {
      timeSlot = 'weekend'
    } else {
      if (bookingHour < 12) timeSlotDetail = 'morning'
      else if (bookingHour < 18) timeSlotDetail = 'afternoon'
      else timeSlotDetail = 'evening'
    }

    const userData = user

    for (const rule of rules || []) {
      let matched = true

      if (rule.type === 'meetingroom' && rule.roomId !== roomId) {
        continue
      }

      for (const condition of rule.conditions || []) {
        if (condition.type === 'timeSlot') {
          const slots = Array.isArray(condition.value) ? condition.value : (condition.value ? condition.value.split(',').map(s => s.trim()) : [])
          const operator = condition.operator || 'in'
          const currentSlots = isWeekend ? ['weekend'] : [timeSlotDetail, 'weekday']
          const hasMatch = currentSlots.some(s => slots.includes(s))
          if (operator === 'in' && !hasMatch) {
            matched = false
          }
          if (operator === 'notIn' && hasMatch) {
            matched = false
          }
        }

        if (condition.type === 'tag') {
          const userTags = userData.permissionTags || []
          const tagValue = condition.value
          const tagValues = Array.isArray(tagValue) ? tagValue : (tagValue ? tagValue.split(',').map(s => s.trim()) : [])
          const hasTag = userTags.some(t => tagValues.includes(t.tagName || t))
          if (condition.operator === 'in' && !hasTag) {
            matched = false
          }
          if (condition.operator === 'notIn' && hasTag) {
            matched = false
          }
        }

        if (condition.type === 'duration') {
          const targetDuration = parseFloat(condition.value)
          if (isNaN(targetDuration)) { matched = false; continue }
          if (condition.operator === 'gt' && duration <= targetDuration) {
            matched = false
          }
          if (condition.operator === 'lt' && duration >= targetDuration) {
            matched = false
          }
          if (condition.operator === 'lte' && duration > targetDuration) {
            matched = false
          }
          if (condition.operator === 'gte' && duration < targetDuration) {
            matched = false
          }
        }

        if (condition.type === 'advanceHours') {
          const hoursDiff = (start - now) / (1000 * 60 * 60)
          const targetHours = parseFloat(condition.value)
          if (isNaN(targetHours)) { matched = false; continue }
          if (condition.operator === 'gte' && hoursDiff < targetHours) {
            matched = false
          }
          if (condition.operator === 'lt' && hoursDiff >= targetHours) {
            matched = false
          }
        }
      }

      if (matched) {
        matchedRule = rule
        // 所有预约都必须手动审批，不允许自动审批
        needApproval = true
        break
      }
    }
  } catch (err) {
    console.error('[BookingCreate] 匹配审批规则失败:', err)
  }

  if (usedPublicResources && usedPublicResources.length > 0) {
    const resourceCheck = await checkResourceAvailability(usedPublicResources, date, startTime, endTime)
    if (!resourceCheck.available) {
      return error(1002, resourceCheck.message)
    }
  }

  const result = await db.collection('bookings').add({
    data: {
      userId: OPENID,
      userName: user.realName || '',
      studentId: user.studentId || '',
      roomId,
      roomName: room.name,
      roomLocation: room.location || '',
      date,
      startTime,
      endTime,
      duration,
      purpose,
      attendees: attendees || 0,
      contactPhone: contactPhone || '',
      status: needApproval ? 'pending' : 'approved',
      needApproval,
      approvalRuleMatched: matchedRule ? matchedRule.name : '默认规则',
      approverId: '',
      approveTime: null,
      rejectReason: '',
      usedPublicResources: usedPublicResources || [],
      creditDeduct: 0,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  })

  await deductResources(usedPublicResources)

  return success({
    bookingId: result._id,
    status: needApproval ? 'pending' : 'approved',
    needApproval,
    ruleName: matchedRule ? matchedRule.name : '默认规则'
  }, needApproval ? '预约申请已提交，等待审批' : '预约成功')
}