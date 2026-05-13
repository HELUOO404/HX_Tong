const { success, error } = require('../../utils/response')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()

  try {
    const required = ['name', 'location', 'capacity']
    const check = validateRequired(params, required)
    if (!check.valid) return error(400, check.message)

    const {
      name,
      location,
      capacity,
      facilities = [],
      images = [],
      openTime = '08:00',
      closeTime = '22:00',
      description = '',
      sort = 0,
      publicResources = [],
      approvalRuleId = null,
      maxAdvanceDays = 0,
      minAdvanceDays = 0
    } = params

    let capacityValue
    if (typeof capacity === 'object') {
      capacityValue = {
        min: capacity.min !== undefined && capacity.min !== null ? parseInt(capacity.min) : 1,
        max: capacity.max !== undefined && capacity.max !== null ? parseInt(capacity.max) : 10
      }
      if (capacityValue.min <= 0 || capacityValue.max <= 0) {
        return error(400, '容量必须大于0')
      }
      if (capacityValue.min > capacityValue.max) {
        return error(400, '最小容量不能大于最大容量')
      }
    } else {
      capacityValue = parseInt(capacity)
      if (capacityValue <= 0) {
        return error(400, '容量必须大于0')
      }
    }

    const { data: existing } = await db.collection('rooms')
      .where({ name })
      .limit(1)
      .get()

    if (existing.length > 0) {
      return error(400, '会议室名称已存在')
    }

    let roomStatus = 'available'
    if (typeof params.status === 'number') {
      roomStatus = params.status === 0 ? 'available' : 'disabled'
    } else if (typeof params.status === 'string') {
      roomStatus = params.status
    }

    const result = await db.collection('rooms').add({
      data: {
        name,
        location,
        capacity: capacityValue,
        facilities: Array.isArray(facilities) ? facilities : [],
        images: Array.isArray(images) ? images : [],
        openTime,
        closeTime,
        description,
        sort: parseInt(sort),
        status: roomStatus,
        publicResources: Array.isArray(publicResources) ? publicResources : [],
        approvalRuleId: approvalRuleId || null,
        maxAdvanceDays: Math.max(0, parseInt(maxAdvanceDays) || 0),
        minAdvanceDays: Math.max(0, parseInt(minAdvanceDays) || 0),
        createdAt: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return success({
      roomId: result._id,
      name,
      location,
      capacity
    }, '会议室创建成功')
  } catch (err) {
    console.error('[roomCreate] 创建会议室失败:', err)
    return error(500, '创建会议室失败')
  }
}
