const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function normalizeResourceQty(resource) {
  let totalQty = resource.totalQuantity
  let availableQty = resource.availableQuantity

  if (!totalQty && totalQty !== 0 && !availableQty && availableQty !== 0) {
    totalQty = 1
    availableQty = 1
  } else if (!totalQty && totalQty !== 0) {
    totalQty = availableQty || 1
  } else if (!availableQty && availableQty !== 0) {
    availableQty = totalQty || 1
  }

  return { totalQty, availableQty }
}

async function ensureResourceQuantityFields(resource) {
  const { totalQty, availableQty } = normalizeResourceQty(resource)
  if (resource.totalQuantity !== totalQty || resource.availableQuantity !== availableQty) {
    try {
      await db.collection('public_resources').doc(resource._id).update({
        data: {
          totalQuantity: totalQty,
          availableQuantity: availableQty,
          updatedAt: db.serverDate()
        }
      })
      console.log(`[resourceManager] 已补充资源 ${resource.name} 的数量字段: total=${totalQty}, available=${availableQty}`)
    } catch (e) {
      console.error('[resourceManager] 补充资源数量字段失败:', resource._id, e)
    }
  }
  return { totalQty, availableQty }
}

async function deductResources(usedPublicResources) {
  if (!usedPublicResources || !Array.isArray(usedPublicResources) || usedPublicResources.length === 0) return

  for (const res of usedPublicResources) {
    const quantity = res.quantity || 1
    try {
      const { data: resource } = await db.collection('public_resources').doc(res.resourceId).get()
      if (!resource) {
        console.error('[deductResources] 资源不存在:', res.resourceId)
        continue
      }

      const { availableQty } = await ensureResourceQuantityFields(resource)
      const newAvailable = Math.max(0, availableQty - quantity)

      await db.collection('public_resources').doc(res.resourceId).update({
        data: {
          availableQuantity: newAvailable,
          updatedAt: db.serverDate()
        }
      })

      console.log('[deductResources] 资源已扣减:', resource.name, '扣减数量:', quantity, '剩余可用:', newAvailable)
    } catch (e) {
      console.error('[deductResources] 处理资源记录失败:', res.resourceId, e)
    }
  }
}

async function restoreResources(usedPublicResources) {
  if (!usedPublicResources || !Array.isArray(usedPublicResources) || usedPublicResources.length === 0) return

  for (const res of usedPublicResources) {
    const quantity = res.quantity || 1
    try {
      const { data: resource } = await db.collection('public_resources').doc(res.resourceId).get()
      if (!resource) {
        console.error('[restoreResources] 资源不存在:', res.resourceId)
        continue
      }

      const { totalQty, availableQty } = await ensureResourceQuantityFields(resource)
      const newAvailable = Math.min(totalQty, availableQty + quantity)

      await db.collection('public_resources').doc(res.resourceId).update({
        data: {
          availableQuantity: newAvailable,
          updatedAt: db.serverDate()
        }
      })

      console.log('[restoreResources] 资源已释放:', resource.name, '释放数量:', quantity, '当前可用:', newAvailable)
    } catch (e) {
      console.error('[restoreResources] 处理资源记录失败:', res.resourceId, e)
    }
  }
}

async function checkResourceAvailability(usedPublicResources, date, startTime, endTime) {
  if (!usedPublicResources || !Array.isArray(usedPublicResources) || usedPublicResources.length === 0) {
    return { available: true }
  }

  for (const res of usedPublicResources) {
    const quantity = res.quantity || 1
    try {
      const { data: resource } = await db.collection('public_resources').doc(res.resourceId).get()
      if (!resource) {
        return { available: false, message: `资源 ${res.name || res.resourceId} 不存在` }
      }

      const { totalQty } = await ensureResourceQuantityFields(resource)

      const { data: occupiedBookings } = await db.collection('bookings')
        .where({
          status: _.in(['pending', 'approved']),
          'usedPublicResources.resourceId': res.resourceId,
          date,
          startTime: _.lt(endTime),
          endTime: _.gt(startTime)
        })
        .limit(100)
        .get()

      let occupiedQuantity = 0
      for (const booking of occupiedBookings) {
        const bookingRes = (booking.usedPublicResources || []).find(r => r.resourceId === res.resourceId)
        if (bookingRes) {
          occupiedQuantity += bookingRes.quantity || 1
        }
      }

      const availableInPeriod = totalQty - occupiedQuantity
      if (availableInPeriod < quantity) {
        return {
          available: false,
          message: `资源「${resource.name}」在该时段数量不足（可用: ${availableInPeriod}，需要: ${quantity}）`
        }
      }
    } catch (e) {
      console.error('[checkResourceAvailability] 检查资源失败:', res.resourceId, e)
    }
  }

  return { available: true }
}

module.exports = { deductResources, restoreResources, checkResourceAvailability }
