const { success, error, notFound } = require('../utils/response')

async function getList(params, cloud) {
  const db = cloud.database()

  try {
    const { status } = params
    let query = {}

    if (status !== undefined && status !== '') {
      const statusNum = typeof status === 'number' ? status : parseInt(status)
      if (!isNaN(statusNum)) {
        query.status = statusNum
      }
    }

    const { data: resources } = await db.collection('public_resources')
      .where(query)
      .orderBy('sort', 'asc')
      .orderBy('createTime', 'desc')
      .get()

    return success(resources || [], '获取成功')
  } catch (err) {
    console.error('[publicResource.getList] 获取公共资源列表失败:', err)
    return error(500, '获取失败: ' + err.message)
  }
}

async function create(params, cloud) {
  const db = cloud.database()
  const { name, type, totalQuantity, description, sort } = params

  if (!name || !name.trim()) {
    return error(400, '资源名称不能为空')
  }

  if (!type || !type.trim()) {
    return error(400, '资源类型不能为空')
  }

  const qty = parseInt(totalQuantity)
  if (isNaN(qty) || qty < 1) {
    return error(400, '资源数量至少为1')
  }

  try {
    const now = db.serverDate()

    const result = await db.collection('public_resources').add({
      data: {
        name: name.trim(),
        type: type.trim(),
        totalQuantity: qty,
        availableQuantity: qty,
        description: description?.trim() || '',
        sort: parseInt(sort) || 0,
        status: 1,
        createTime: now,
        updateTime: now
      }
    })

    console.log(`[publicResource.create] 创建公共资源成功: ${result._id}`)

    return success({
      _id: result._id,
      name: name.trim()
    }, '创建成功')
  } catch (err) {
    console.error('[publicResource.create] 创建公共资源失败:', err)
    return error(500, '创建失败: ' + err.message)
  }
}

async function update(params, cloud) {
  const db = cloud.database()
  const { resourceId, name, type, totalQuantity, description, sort } = params

  if (!resourceId) {
    return error(400, '缺少资源ID')
  }

  try {
    const { data: resources } = await db.collection('public_resources')
      .where({ _id: resourceId })
      .limit(1)
      .get()

    if (resources.length === 0) {
      return notFound('公共资源')
    }

    const updateData = {
      updateTime: db.serverDate()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (type !== undefined) updateData.type = type.trim()
    if (totalQuantity !== undefined) {
      const newTotal = parseInt(totalQuantity) || 0
      const oldTotal = resources[0].totalQuantity || 0
      const oldAvailable = resources[0].availableQuantity || 0
      const diff = newTotal - oldTotal
      updateData.totalQuantity = newTotal
      updateData.availableQuantity = Math.max(0, oldAvailable + diff)
    }
    if (description !== undefined) updateData.description = description.trim()
    if (sort !== undefined) updateData.sort = parseInt(sort) || 0

    await db.collection('public_resources')
      .doc(resourceId)
      .update({ data: updateData })

    console.log(`[publicResource.update] 更新公共资源成功: ${resourceId}`)

    return success({ _id: resourceId }, '更新成功')
  } catch (err) {
    console.error('[publicResource.update] 更新公共资源失败:', err)
    return error(500, '更新失败: ' + err.message)
  }
}

async function remove(params, cloud) {
  const db = cloud.database()
  const { resourceId } = params

  if (!resourceId) {
    return error(400, '缺少资源ID')
  }

  try {
    const { data: resources } = await db.collection('public_resources')
      .where({ _id: resourceId })
      .limit(1)
      .get()

    if (resources.length === 0) {
      return notFound('公共资源')
    }

    await db.collection('public_resources').doc(resourceId).remove()

    console.log(`[publicResource.remove] 删除公共资源成功: ${resourceId}`)

    return success({ _id: resourceId }, '删除成功')
  } catch (err) {
    console.error('[publicResource.remove] 删除公共资源失败:', err)
    return error(500, '删除失败: ' + err.message)
  }
}

async function changeStatus(params, cloud) {
  const db = cloud.database()
  const { resourceId, status } = params

  if (!resourceId) {
    return error(400, '缺少资源ID')
  }

  if (status === undefined || status === null) {
    return error(400, '缺少状态参数')
  }

  const statusValue = typeof status === 'number' ? status : parseInt(status)
  if (isNaN(statusValue) || (statusValue !== 0 && statusValue !== 1)) {
    return error(400, '状态值无效，仅支持0(停用)或1(可用)')
  }

  try {
    const { data: resources } = await db.collection('public_resources')
      .where({ _id: resourceId })
      .limit(1)
      .get()

    if (resources.length === 0) {
      return notFound('公共资源')
    }

    await db.collection('public_resources')
      .doc(resourceId)
      .update({
        data: {
          status: statusValue,
          updateTime: db.serverDate()
        }
      })

    console.log(`[publicResource.changeStatus] 修改状态成功: ${resourceId} -> ${statusValue}`)

    return success({ _id: resourceId, status: statusValue }, '状态修改成功')
  } catch (err) {
    console.error('[publicResource.changeStatus] 修改状态失败:', err)
    return error(500, '修改失败: ' + err.message)
  }
}

module.exports = { getList, create, update, remove, changeStatus }
