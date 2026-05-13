const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

async function getPublicResources(params, cloud) {
  const db = cloud.database()
  const _ = db.command

  try {
    let resources
    try {
      const result = await db.collection('public_resources')
        .orderBy('sort', 'asc')
        .limit(100)
        .get()
      resources = result.data
    } catch (err) {
      if (err.message && err.message.includes('not exist')) {
        try {
          await db.createCollection('public_resources')
        } catch (createErr) {
          console.error('[getPublicResources] 创建public_resources集合失败:', createErr)
        }
        return { code: 200, message: 'ok', data: { list: [], total: 0 } }
      }
      throw err
    }

    const list = resources.filter(r => {
      const isActive = r.status === 1 || r.status === true || r.status === 'available' || r.status === '1' || (typeof r.status === 'number' && r.status > 0)
      return isActive
    })

    const { date, startTime, endTime } = params || {}

    if (date && startTime && endTime && list.length > 0) {
      const resourceIds = list.map(r => r._id)

      const { data: occupiedBookings } = await db.collection('bookings')
        .where({
          status: _.in(['pending', 'approved']),
          date,
          startTime: _.lt(endTime),
          endTime: _.gt(startTime),
          'usedPublicResources.resourceId': _.in(resourceIds)
        })
        .limit(200)
        .get()

      const occupiedMap = {}
      for (const booking of occupiedBookings) {
        const usedResources = booking.usedPublicResources || []
        for (const usedRes of usedResources) {
          const rid = usedRes.resourceId
          if (!occupiedMap[rid]) occupiedMap[rid] = 0
          occupiedMap[rid] += usedRes.quantity || 1
        }
      }

      for (const resource of list) {
        const totalQty = resource.totalQuantity || 1
        const occupiedQty = occupiedMap[resource._id] || 0
        resource.availableInPeriod = Math.max(0, totalQty - occupiedQty)
        resource.totalQuantity = totalQty
      }
    }

    return { code: 200, message: 'ok', data: { list, total: list.length } }
  } catch (err) {
    console.error('[getPublicResources] 获取公共资源列表失败:', err)
    return { code: 500, message: '获取公共资源列表失败', data: null }
  }
}

module.exports = getPublicResources
