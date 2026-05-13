const { success, error, notFound } = require('../../utils/response')
const { validateRequired } = require('../../utils/validator')

module.exports = async (params, cloud) => {
  const db = cloud.database()
  const _ = db.command

  try {
    const required = ['roomId']
    const check = validateRequired(params, required)
    if (!check.valid) return error(400, check.message)

    const { roomId, ...updateData } = params

    const { data: room } = await db.collection('rooms').doc(roomId).get()
    if (!room) {
      return notFound('会议室')
    }

    const updateFields = {}

    const allowedFields = [
      'name', 'location', 'capacity', 'facilities',
      'images', 'openTime', 'closeTime', 'description', 'sort', 'status',
      'publicResources', 'approvalRuleId',
      'maxAdvanceDays', 'minAdvanceDays'
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'sort') {
          updateFields[field] = parseInt(updateData[field])
        } else if (field === 'capacity') {
          if (typeof updateData[field] === 'number') {
            updateFields[field] = updateData[field]
          } else if (typeof updateData[field] === 'object') {
            updateFields[field] = {
              min: updateData[field].min !== undefined && updateData[field].min !== null ? parseInt(updateData[field].min) : 1,
              max: updateData[field].max !== undefined && updateData[field].max !== null ? parseInt(updateData[field].max) : 10
            }
          }
        } else if (field === 'facilities' || field === 'images') {
          updateFields[field] = Array.isArray(updateData[field]) ? updateData[field] : []
        } else if (field === 'publicResources') {
          updateFields[field] = Array.isArray(updateData[field]) ? updateData[field] : []
        } else if (field === 'maxAdvanceDays' || field === 'minAdvanceDays') {
          updateFields[field] = Math.max(0, parseInt(updateData[field]) || 0)
        } else {
          updateFields[field] = updateData[field]
        }
      }
    }

    if (updateFields.capacity !== undefined) {
      if (typeof updateFields.capacity === 'number' && updateFields.capacity <= 0) {
        return error(400, '容量必须大于0')
      }
      if (typeof updateFields.capacity === 'object') {
        if (updateFields.capacity.min <= 0 || updateFields.capacity.max <= 0) {
          return error(400, '容量必须大于0')
        }
        if (updateFields.capacity.min > updateFields.capacity.max) {
          return error(400, '最小容量不能大于最大容量')
        }
      }
    }

    if (updateFields.name && updateFields.name !== room.name) {
      const { data: existing } = await db.collection('rooms')
        .where({
          name: updateFields.name,
          _id: _.neq(roomId)
        })
        .limit(1)
        .get()

      if (existing.length > 0) {
        return error(400, '会议室名称已存在')
      }
    }

    updateFields.updateTime = db.serverDate()

    await db.collection('rooms').doc(roomId).update({
      data: updateFields
    })

    return success({
      roomId,
      updatedFields: Object.keys(updateFields).filter(k => k !== 'updateTime')
    }, '会议室更新成功')
  } catch (err) {
    console.error('[roomUpdate] 更新会议室失败:', err)
    return error(500, '更新会议室失败')
  }
}
