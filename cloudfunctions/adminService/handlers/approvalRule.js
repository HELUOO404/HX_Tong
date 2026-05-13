const { success, error, notFound } = require('../utils/response')

const VALID_CONDITION_TYPES = ['timeSlot', 'tag', 'duration', 'advanceHours']
const VALID_ACTIONS = ['manual_approve']

const CONDITION_TYPE_NAMES = {
  timeSlot: '时段',
  tag: '用户标签',
  duration: '预约时长',
  advanceHours: '提前预约'
}

const ACTION_TEXTS = {
  manual_approve: '人工审批'
}

function formatConditionsText(conditions) {
  if (!conditions || conditions.length === 0) return '无条件'
  return conditions.map(c => {
    const typeName = CONDITION_TYPE_NAMES[c.type] || c.type
    return typeName
  }).join('、')
}

function getActionText(action) {
  return ACTION_TEXTS[action] || action
}

async function getList(params, cloud) {
  const db = cloud.database()

  try {
    const { status } = params
    let query = {}

    if (status !== undefined && status !== '') {
      if (status === 0 || status === false || status === 'false') {
        query.enabled = false
      } else if (status === 1 || status === true || status === 'true') {
        query.enabled = true
      }
    }

    const { data: rules } = await db.collection('approval_rules')
      .where(query)
      .orderBy('createTime', 'desc')
      .get()

    const enrichedRules = (rules || []).map(rule => ({
      ...rule,
      conditionsText: formatConditionsText(rule.conditions),
      actionText: getActionText(rule.action)
    }))

    return success(enrichedRules, '获取成功')
  } catch (err) {
    console.error('[approvalRule.getList] 获取审批规则列表失败:', err)
    return error(500, '获取失败: ' + err.message)
  }
}

async function create(params, cloud) {
  const db = cloud.database()
  const { name, type, priority, conditions, action, roomId, enabled } = params

  if (!name || !name.trim()) {
    return error(400, '规则名称不能为空')
  }

  const ruleAction = action || 'manual_approve'
  if (!VALID_ACTIONS.includes(ruleAction)) {
    return error(400, '不支持的审批动作，仅支持手动审批')
  }

  if (conditions && Array.isArray(conditions)) {
    for (const c of conditions) {
      if (!VALID_CONDITION_TYPES.includes(c.type)) {
        return error(400, `不支持的条件类型: ${c.type}`)
      }
    }
  }

  try {
    const now = db.serverDate()

    const result = await db.collection('approval_rules').add({
      data: {
        name: name.trim(),
        type: type || 'global',
        priority: priority || 10,
        conditions: conditions || [],
        action: ruleAction,
        roomId: roomId || '',
        enabled: enabled !== undefined ? enabled : true,
        status: enabled !== false ? 1 : 0,
        createTime: now,
        updateTime: now
      }
    })

    console.log(`[approvalRule.create] 创建审批规则成功: ${result._id}`)

    return success({
      _id: result._id,
      name: name.trim()
    }, '创建成功')
  } catch (err) {
    console.error('[approvalRule.create] 创建审批规则失败:', err)
    return error(500, '创建失败: ' + err.message)
  }
}

async function update(params, cloud) {
  const db = cloud.database()
  const { ruleId, name, type, priority, conditions, action, roomId, enabled } = params

  if (!ruleId) {
    return error(400, '缺少规则ID')
  }

  if (action !== undefined && !VALID_ACTIONS.includes(action)) {
    return error(400, '不支持的审批动作，仅支持手动审批')
  }

  if (conditions !== undefined && Array.isArray(conditions)) {
    for (const c of conditions) {
      if (!VALID_CONDITION_TYPES.includes(c.type)) {
        return error(400, `不支持的条件类型: ${c.type}`)
      }
    }
  }

  try {
    const { data: rules } = await db.collection('approval_rules')
      .where({ _id: ruleId })
      .limit(1)
      .get()

    if (rules.length === 0) {
      return notFound('审批规则')
    }

    if (rules[0].isDefault) {
      return error(400, '默认规则不可编辑')
    }

    const updateData = {
      updateTime: db.serverDate()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (type !== undefined) updateData.type = type
    if (priority !== undefined) updateData.priority = priority
    if (conditions !== undefined) updateData.conditions = conditions
    if (action !== undefined) updateData.action = action
    if (roomId !== undefined) updateData.roomId = roomId
    if (enabled !== undefined) {
      updateData.enabled = enabled
      updateData.status = enabled ? 1 : 0
    }

    await db.collection('approval_rules')
      .doc(ruleId)
      .update({ data: updateData })

    console.log(`[approvalRule.update] 更新审批规则成功: ${ruleId}`)

    return success({ _id: ruleId }, '更新成功')
  } catch (err) {
    console.error('[approvalRule.update] 更新审批规则失败:', err)
    return error(500, '更新失败: ' + err.message)
  }
}

async function remove(params, cloud) {
  const db = cloud.database()
  const { ruleId } = params

  if (!ruleId) {
    return error(400, '缺少规则ID')
  }

  try {
    const { data: rules } = await db.collection('approval_rules')
      .where({ _id: ruleId })
      .limit(1)
      .get()

    if (rules.length === 0) {
      return notFound('审批规则')
    }

    if (rules[0].isDefault) {
      return error(400, '默认规则不可删除')
    }

    await db.collection('approval_rules').doc(ruleId).remove()

    console.log(`[approvalRule.remove] 删除审批规则成功: ${ruleId}`)

    return success({ _id: ruleId }, '删除成功')
  } catch (err) {
    console.error('[approvalRule.remove] 删除审批规则失败:', err)
    return error(500, '删除失败: ' + err.message)
  }
}

async function toggle(params, cloud) {
  const db = cloud.database()
  const { ruleId, enabled } = params

  if (!ruleId) {
    return error(400, '缺少规则ID')
  }

  try {
    const { data: rules } = await db.collection('approval_rules')
      .where({ _id: ruleId })
      .limit(1)
      .get()

    if (rules.length === 0) {
      return notFound('审批规则')
    }

    const currentRule = rules[0]
    const newEnabled = enabled !== undefined ? enabled : !currentRule.enabled

    await db.collection('approval_rules')
      .doc(ruleId)
      .update({
        data: {
          enabled: newEnabled,
          status: newEnabled ? 1 : 0,
          updateTime: db.serverDate()
        }
      })

    console.log(`[approvalRule.toggle] 切换状态成功: ${ruleId} -> ${newEnabled}`)

    return success({ _id: ruleId, enabled: newEnabled }, '状态切换成功')
  } catch (err) {
    console.error('[approvalRule.toggle] 切换状态失败:', err)
    return error(500, '切换失败: ' + err.message)
  }
}

async function fixStatus(params, cloud) {
  const db = cloud.database()

  try {
    const { data: rules } = await db.collection('approval_rules')
      .where(db.command.or([
        { enabled: true, status: db.command.neq(1) },
        { enabled: false, status: db.command.neq(0) }
      ]))
      .get()

    if (!rules || rules.length === 0) {
      return success({ fixed: 0 }, '无需修复')
    }

    let fixedCount = 0
    for (const rule of rules) {
      const newStatus = rule.enabled ? 1 : 0
      await db.collection('approval_rules')
        .doc(rule._id)
        .update({
          data: {
            status: newStatus,
            updateTime: db.serverDate()
          }
        })
      fixedCount++
    }

    console.log(`[approvalRule.fixStatus] 修复了 ${fixedCount} 条规则的 status 字段`)
    return success({ fixed: fixedCount }, `修复了 ${fixedCount} 条规则`)
  } catch (err) {
    console.error('[approvalRule.fixStatus] 修复失败:', err)
    return error(500, '修复失败: ' + err.message)
  }
}

module.exports = { getList, create, update, remove, toggle, fixStatus }
