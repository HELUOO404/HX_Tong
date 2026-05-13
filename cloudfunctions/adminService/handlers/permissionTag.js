const { success, error, notFound } = require('../utils/response')

async function getList(params, cloud) {
  const db = cloud.database()

  try {
    const { data: tags } = await db.collection('permission_tags')
      .orderBy('createTime', 'desc')
      .get()

    return success(tags || [], '获取成功')
  } catch (err) {
    console.error('[permissionTag.getList] 获取权限标签列表失败:', err)
    return error(500, '获取失败: ' + err.message)
  }
}

async function create(params, cloud) {
  const db = cloud.database()
  const { name, description, permissions } = params

  if (!name || !name.trim()) {
    return error(400, '标签名称不能为空')
  }

  try {
    const now = db.serverDate()

    const { data: existing } = await db.collection('permission_tags')
      .where({ name: name.trim() })
      .limit(1)
      .get()
    if (existing.length > 0) {
      return error(400, '标签名称已存在')
    }

    const result = await db.collection('permission_tags').add({
      data: {
        name: name.trim(),
        tagId: '', // 稍后回填
        description: description?.trim() || '',
        role: params.role || '',
        permissions: permissions || {},
        createTime: now,
        updateTime: now
      }
    })

    await db.collection('permission_tags').doc(result._id).update({
      data: { tagId: result._id }
    })

    console.log(`[permissionTag.create] 创建权限标签成功: ${result._id}`)

    return success({
      _id: result._id,
      tagId: result._id,
      name: name.trim()
    }, '创建成功')
  } catch (err) {
    console.error('[permissionTag.create] 创建权限标签失败:', err)
    return error(500, '创建失败: ' + err.message)
  }
}

async function update(params, cloud) {
  const db = cloud.database()
  const { tagId, name, description, permissions } = params

  if (!tagId) {
    return error(400, '缺少标签ID')
  }

  if (!name || !name.trim()) {
    return error(400, '标签名称不能为空')
  }

  try {
    const { data: tags } = await db.collection('permission_tags')
      .where({ _id: tagId })
      .limit(1)
      .get()

    if (tags.length === 0) {
      return notFound('权限标签')
    }

    const { data: nameConflict } = await db.collection('permission_tags')
      .where({ name: name.trim(), _id: db.command.neq(tagId) })
      .limit(1)
      .get()
    if (nameConflict.length > 0) {
      return error(400, '标签名称已存在')
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      permissions: permissions || {},
      updateTime: db.serverDate()
    }

    if (params.role !== undefined) updateData.role = params.role

    await db.collection('permission_tags')
      .doc(tagId)
      .update({ data: updateData })

    console.log(`[permissionTag.update] 更新权限标签成功: ${tagId}`)

    return success({ _id: tagId }, '更新成功')
  } catch (err) {
    console.error('[permissionTag.update] 更新权限标签失败:', err)
    return error(500, '更新失败: ' + err.message)
  }
}

async function remove(params, cloud) {
  const db = cloud.database()
  const { tagId } = params

  if (!tagId) {
    return error(400, '缺少标签ID')
  }

  try {
    const { data: tags } = await db.collection('permission_tags')
      .where({ _id: tagId })
      .limit(1)
      .get()

    if (tags.length === 0) {
      return notFound('权限标签')
    }

    await db.collection('permission_tags').doc(tagId).remove()

    console.log(`[permissionTag.remove] 删除权限标签成功: ${tagId}`)

    return success({ _id: tagId }, '删除成功')
  } catch (err) {
    console.error('[permissionTag.remove] 删除权限标签失败:', err)
    return error(500, '删除失败: ' + err.message)
  }
}

async function initSystem(params, cloud) {
  const db = cloud.database()

  try {
    const defaultTags = [
      { tagId: 'system', tagName: '系统管理员', role: 'systemAdmin', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: true, canAssignPermissionTags: true }, description: '拥有所有权限，包含数据库管理' },
      { tagId: 'super', tagName: '超级管理员', role: 'superAdmin', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: false, canAssignPermissionTags: true }, description: '拥有除数据库管理外的所有权限' },
      { tagId: 'academy', tagName: '书院管理人', role: 'academyManager', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: false, canManageApprovalRules: true, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false }, description: '可增删改会议室、管理公共资源、审批预约、查看用户、管理审批规则' },
      { tagId: 'approval', tagName: '审批管理人', role: 'approvalManager', permissions: { canManageRooms: false, canDeleteRooms: false, canManagePublicResources: false, canApproveBookings: true, canViewAllUsers: false, canEditUsers: false, canManageApprovalRules: false, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false }, description: '仅可审批预约' }
    ]

    const now = db.serverDate()
    const results = []

    for (const tag of defaultTags) {
      const { data: existing } = await db.collection('permission_tags')
        .where(db.command.or([{ tagId: tag.tagId }, { name: tag.tagName }]))
        .limit(1)
        .get()

      if (existing.length > 0) {
        await db.collection('permission_tags').doc(existing[0]._id).update({
          data: { ...tag, name: tag.tagName, updateTime: now }
        })
        results.push({ tagId: tag.tagId, action: 'updated' })
      } else {
        await db.collection('permission_tags').add({
          data: { ...tag, name: tag.tagName, isSystem: true, createTime: now, updateTime: now }
        })
        results.push({ tagId: tag.tagId, action: 'created' })
      }
    }

    if (params && params.initAdmin) {
      const { adminId, tagId: adminTagId } = params
      if (adminId && adminTagId) {
        const tag = defaultTags.find(t => t.tagId === adminTagId)
        if (tag) {
          await db.collection('admins').doc(adminId).update({
            data: {
              permissionTags: [{ tagId: tag.tagId, tagName: tag.tagName, role: tag.role, permissions: tag.permissions }],
              role: tag.role,
              updatedAt: now
            }
          })
          results.push({ adminId, tagId: adminTagId, action: 'adminPermissionTagsUpdated' })
        }
      }
    }

    console.log('[permissionTag.initSystem] 初始化完成:', results)

    return success({ results }, '系统权限标签初始化成功')
  } catch (err) {
    console.error('[permissionTag.initSystem] 初始化失败:', err)
    return error(500, '初始化失败: ' + err.message)
  }
}

module.exports = { getList, create, update, remove, initSystem, fixSystemTags, removeOldTags }

async function fixSystemTags(params, cloud) {
  const db = cloud.database()

  try {
    const standardTags = [
      { tagId: 'system', name: '系统管理员', tagName: '系统管理员', role: 'systemAdmin', description: '拥有所有权限，包含数据库管理', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: true, canAssignPermissionTags: true } },
      { tagId: 'super', name: '超级管理员', tagName: '超级管理员', role: 'superAdmin', description: '拥有除数据库管理外的所有权限', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: false, canAssignPermissionTags: true } },
      { tagId: 'academy', name: '书院管理人', tagName: '书院管理人', role: 'academyManager', description: '可增删改会议室、管理公共资源、审批预约、查看用户、管理审批规则', permissions: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: false, canManageApprovalRules: true, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false } },
      { tagId: 'approval', name: '审批管理人', tagName: '审批管理人', role: 'approvalManager', description: '仅可审批预约', permissions: { canManageRooms: false, canDeleteRooms: false, canManagePublicResources: false, canApproveBookings: true, canViewAllUsers: false, canEditUsers: false, canManageApprovalRules: false, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false } }
    ]
    const standardTagIds = ['system', 'super', 'academy', 'approval']
    const now = db.serverDate()

    let created = 0
    let updated = 0

    const oldSystemTags = await db.collection('permission_tags')
      .where({ isSystem: true, tagId: db.command.nin(standardTagIds) })
      .get()
    let removed = oldSystemTags.data.length
    for (const tag of oldSystemTags.data) {
      await db.collection('permission_tags').doc(tag._id).remove()
    }

    // 2. 同时清理没有 isSystem 字段但有旧 name 的标签（如 'superAdmin'）
    const { data: invalidTags } = await db.collection('permission_tags')
      .where({ tagId: db.command.nin(standardTagIds), isSystem: db.command.exists(false) })
      .get()
    for (const tag of invalidTags.data) {
      await db.collection('permission_tags').doc(tag._id).remove()
      removed++
    }

    // 3. upsert 4 个标准系统标签
    for (const tag of standardTags) {
      const { data: existing } = await db.collection('permission_tags')
        .where({ tagId: tag.tagId })
        .limit(1)
        .get()

      if (existing.length > 0) {
        await db.collection('permission_tags').doc(existing[0]._id).update({
          data: { ...tag, isSystem: true, updateTime: now }
        })
        updated++
      } else {
        await db.collection('permission_tags').add({
          data: { ...tag, isSystem: true, createTime: now, updateTime: now }
        })
        created++
      }
    }

    console.log(`[permissionTag.fixSystemTags] 创建 ${created} 更新 ${updated} 删除 ${removed}`)
    return success({ created, updated, removed }, `系统标签修复完成：创建 ${created}，更新 ${updated}，删除 ${removed}`)
  } catch (err) {
    console.error('[permissionTag.fixSystemTags] 失败:', err)
    return error(500, '修复失败: ' + err.message)
  }
}

async function removeOldTags(params, cloud) {
  const db = cloud.database()
  const standardTagIds = ['system', 'super', 'academy', 'approval']

  try {
    const { data: oldTags } = await db.collection('permission_tags')
      .where({ isSystem: true, tagId: db.command.nin(standardTagIds) })
      .get()

    let removed = 0
    for (const tag of oldTags) {
      await db.collection('permission_tags').doc(tag._id).remove()
      removed++
    }

    return success({ removed }, `清理完成：删除 ${removed} 个旧标签`)
  } catch (err) {
    console.error('[permissionTag.removeOldTags] 失败:', err)
    return error(500, '清理失败: ' + err.message)
  }
}
