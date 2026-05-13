/**
 * @file 数据库查看处理器
 * @description 查看数据库集合列表、文档数量和示例数据
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 1.0.0
 */

const { success, error } = require('../utils/response')

/**
 * 查看数据库
 * @param {Object} params - 参数
 * @param {string} params.collection - 指定查看的集合名称（可选）
 * @param {number} params.limit - 返回文档数量限制（默认10）
 * @param {Object} cloud - 云开发实例
 * @returns {Object} 响应结果
 */
async function dbViewer(params, cloud) {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { data: adminData } = await db.collection('admins')
    .where({ _openid: OPENID })
    .limit(1)
    .get()

  if (adminData.length === 0) {
    return error(403, '仅管理员可执行此操作')
  }

  const { collection, limit = 10 } = params

  try {
    // 定义所有集合
    const allCollections = [
      { name: 'users', description: '用户表' },
      { name: 'rooms', description: '会议室表' },
      { name: 'bookings', description: '预约表' },
      { name: 'credit_scores', description: '信誉分表' },
      { name: 'credit_records', description: '信誉分记录表' },
      { name: 'admins', description: '管理员表' },
      { name: 'approval_rules', description: '审批规则表' },
      { name: 'public_resources', description: '公共资源表' },
      { name: 'permission_tags', description: '权限标签表' }
    ]

    // 如果指定了集合，返回该集合的详细数据
    if (collection) {
      const collInfo = allCollections.find(c => c.name === collection)
      if (!collInfo) {
        return error(404, `集合 ${collection} 不存在`)
      }

      try {
        // 获取文档总数
        const countResult = await db.collection(collection).count()
        const total = countResult.total

        // 获取最近插入的文档
        const { data } = await db.collection(collection)
          .orderBy('_id', 'desc')
          .limit(parseInt(limit))
          .get()

        // 敏感字段脱敏处理
        const sanitizedData = data.map(doc => {
          const sanitized = { ...doc }
          // 对密码字段进行脱敏
          if (sanitized.password) {
            sanitized.password = '********'
          }
          return sanitized
        })

        return success({
          collection: collection,
          description: collInfo.description,
          total: total,
          returned: sanitizedData.length,
          records: sanitizedData
        }, `查询 ${collection} 集合成功`)
      } catch (err) {
        return error(500, `查询集合 ${collection} 失败: ${err.message}`)
      }
    }

    // 未指定集合，返回所有集合的统计信息
    const stats = []

    for (const coll of allCollections) {
      try {
        const countResult = await db.collection(coll.name).count()
        stats.push({
          name: coll.name,
          description: coll.description,
          count: countResult.total,
          status: 'available'
        })
      } catch (err) {
        stats.push({
          name: coll.name,
          description: coll.description,
          count: 0,
          status: 'error',
          error: err.message
        })
      }
    }

    // 计算总文档数
    const totalDocuments = stats.reduce((sum, s) => sum + (s.count || 0), 0)
    const availableCollections = stats.filter(s => s.status === 'available').length

    return success({
      summary: {
        totalCollections: allCollections.length,
        availableCollections: availableCollections,
        totalDocuments: totalDocuments
      },
      collections: stats
    }, '数据库统计信息')
  } catch (err) {
    console.error('[dbViewer] 查看数据库失败:', err)
    return error(500, '查看数据库失败: ' + err.message)
  }
}

module.exports = dbViewer
