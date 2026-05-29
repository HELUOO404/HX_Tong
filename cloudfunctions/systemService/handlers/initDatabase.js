/**
 * @file 数据库初始化处理器
 * @description 清空数据库中的业务数据（用户、会议室、预约等），保留管理员信息
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 4.0.0
 */

const { success, error } = require('../utils/response')
const bcrypt = require('bcryptjs')

function isAlreadyExistsError(err) {
  if (!err || !err.message) return false
  const msg = err.message.toLowerCase()
  return msg.includes('already exists') ||
         msg.includes('已存在') ||
         msg.includes('duplicate') ||
         msg.includes('唯一索引') ||
         msg.includes('unique') ||
         msg.includes('table exist')
}

async function initDatabase(params, cloud) {
  const db = cloud.database()
  const _ = cloud.database().command
  const { OPENID } = cloud.getWXContext()

  const { data: adminData } = await db.collection('admins')
    .where({ _openid: OPENID })
    .limit(1)
    .get()

  if (adminData.length === 0 || adminData[0].role !== 'systemAdmin') {
    return error(403, '仅超级管理员可执行此操作')
  }

  const {
    resetAll = false,
    adminUsername = 'superadmin',
    adminPassword = '<CHANGE_ME>',
    initSampleData = true
  } = params || {}

  const result = {
    cleared: {
      users: 0,
      rooms: 0,
      bookings: 0,
      credit_scores: 0,
      credit_records: 0,
      approval_rules: 0,
      public_resources: 0,
      permission_tags: 0
    },
    adminReset: false,
    adminCreated: false,
    sampleRooms: [],
    approvalRules: [],
    publicResources: [],
    permissionTags: [],
    warnings: [],
    errors: []
  }

  try {
    await ensureCollections(db, result)

    if (resetAll) {
      await clearAllData(db, result, _)
      await initAdmin(db, result, adminUsername, adminPassword, true)
    } else {
      await clearBusinessData(db, result, _)
      await initAdmin(db, result, adminUsername, adminPassword, false)
    }

    if (initSampleData) {
      await createSampleData(db, result)
    }

    const hasErrors = result.errors.length > 0
    let message
    if (hasErrors) {
      message = `初始化完成，有 ${result.errors.length} 个错误`
    } else {
      const clearedCount = Object.values(result.cleared).reduce((a, b) => a + b, 0)
      message = resetAll
        ? `数据库已完全重置，共清空 ${clearedCount} 条数据`
        : `数据库业务数据已清空（${clearedCount} 条），管理员已保留`
    }

    return {
      code: 200,
      message,
      data: result
    }
  } catch (err) {
    console.error('[initDatabase] 初始化失败:', err)
    return {
      code: 500,
      message: '数据库初始化失败: ' + err.message,
      data: null
    }
  }
}

async function ensureCollections(db, result) {
  const requiredCollections = [
    'users',
    'rooms',
    'bookings',
    'credit_scores',
    'credit_records',
    'admins',
    'admin_tokens',
    'approval_rules',
    'public_resources',
    'permission_tags'
  ]

  for (const collName of requiredCollections) {
    try {
      await db.createCollection(collName)
      console.log(`[ensureCollections] 创建集合成功: ${collName}`)
    } catch (err) {
      if (isAlreadyExistsError(err)) {
        console.log(`[ensureCollections] 集合已存在: ${collName}`)
      } else {
        console.error(`[ensureCollections] 创建集合失败 ${collName}:`, err.message)
        result.warnings.push({ type: 'collection_create', name: collName, message: err.message })
      }
    }
  }
}

async function clearAllData(db, result, _) {
  const collectionsToClear = [
    'users',
    'rooms',
    'bookings',
    'credit_scores',
    'credit_records',
    'permission_tags',
    'approval_rules',
    'public_resources',
    'admins',
    'admin_tokens'
  ]

  for (const collName of collectionsToClear) {
    try {
      const deleted = await clearCollection(db, collName)
      result.cleared[collName] = deleted
    } catch (err) {
      console.error(`[clearAllData] 清空 ${collName} 失败:`, err)
      result.errors.push({ type: 'clear_data', name: collName, message: err.message })
    }
  }

  result.adminReset = true
}

async function clearBusinessData(db, result, _) {
  const collectionsToClear = [
    'users',
    'rooms',
    'bookings',
    'credit_scores',
    'credit_records',
    'approval_rules',
    'public_resources',
    'permission_tags'
  ]

  for (const collName of collectionsToClear) {
    try {
      const deleted = await clearCollection(db, collName)
      result.cleared[collName] = deleted
    } catch (err) {
      console.error(`[clearBusinessData] 清空 ${collName} 失败:`, err)
      result.errors.push({ type: 'clear_data', name: collName, message: err.message })
    }
  }
}

async function clearCollection(db, collName) {
  let totalDeleted = 0
  const batchSize = 100

  while (true) {
    const { data } = await db.collection(collName).limit(batchSize).get()

    if (data.length === 0) {
      break
    }

    const ids = data.map(doc => doc._id)

    for (const id of ids) {
      try {
        await db.collection(collName).doc(id).remove()
        totalDeleted++
      } catch (err) {
        console.error(`[clearCollection] 删除 ${collName}/${id} 失败:`, err)
      }
    }

    if (data.length < batchSize) {
      break
    }
  }

  return totalDeleted
}

async function initAdmin(db, result, username, password, forceReset) {
  try {
    const adminsCollection = db.collection('admins')
    const existingAdmin = await adminsCollection
      .where({ username })
      .limit(1)
      .get()

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    if (existingAdmin.data.length === 0) {
      await adminsCollection.add({
        data: {
          username,
          passwordHash,
          role: 'systemAdmin',
          name: '系统管理员',
          status: 'active',
          permissionTags: [{
            tagId: 'system',
            tagName: '系统管理员',
            role: 'systemAdmin',
            permissions: {
              canManageRooms: true,
              canDeleteRooms: true,
              canManagePublicResources: true,
              canApproveBookings: true,
              canViewAllUsers: true,
              canEditUsers: true,
              canManageApprovalRules: true,
              canManagePermissions: true,
              canManageSystem: true,
              canDatabaseManage: true,
              canAssignPermissionTags: true
            }
          }],
          createTime: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
      result.adminCreated = true
      result.adminUsername = username
    } else {
      if (forceReset) {
        await adminsCollection.doc(existingAdmin.data[0]._id).update({
          data: {
            passwordHash,
            updatedAt: db.serverDate()
          }
        })
        result.adminCreated = true
        result.adminUsername = username
        result.adminMessage = '管理员密码已重置'
      } else {
        result.adminCreated = false
        result.adminUsername = username
        result.adminMessage = '管理员已存在，保留不变'
        result.warnings.push({ type: 'admin_kept', name: username, message: '管理员账号已保留' })
      }
    }
  } catch (err) {
    result.errors.push({ type: 'admin_create', name: username, message: err.message })
  }
}

async function createSampleData(db, result) {
  await createSampleRooms(db, result)
  await createApprovalRules(db, result)
  await createPublicResources(db, result)
  await createPermissionTags(db, result)
}

async function createSampleRooms(db, result) {
  try {
    const roomsCollection = db.collection('rooms')
    const existing = await roomsCollection.where({ name: '红棉阁' }).limit(1).get()

    if (existing.data.length === 0) {
      const sampleRooms = [
        {
          name: '红棉阁',
          location: '红芯书院',
          capacity: { min: 10, max: 30 },
          description: '中型会议室，配备完善的投影和音响设备，适合团队会议和小型研讨',
          facilities: [
            { id: 'f1', name: '投影仪', type: 'projector', icon: 'projector' },
            { id: 'f2', name: '白板', type: 'whiteboard', icon: 'whiteboard' },
            { id: 'f3', name: '音响系统', type: 'audio', icon: 'audio' },
            { id: 'f4', name: '空调', type: 'aircon', icon: 'aircon' }
          ],
          publicResources: [],
          openTime: '08:00',
          closeTime: '22:00',
          status: 'available',
          images: [],
          approvalRuleId: '',
          createdBy: 'system',
          createdByName: '系统初始化',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      ]

      for (const room of sampleRooms) {
        const res = await roomsCollection.add({ data: room })
        result.sampleRooms.push({ name: room.name, _id: res._id })
      }
    } else {
      result.sampleRooms.push({ name: '红棉阁', _id: existing.data[0]._id, status: 'existed' })
      result.warnings.push({ type: 'room_existed', name: '红棉阁', message: '会议室已存在，跳过创建' })
    }
  } catch (err) {
    result.errors.push({ type: 'room_create', name: '红棉阁', message: err.message })
  }
}

async function createApprovalRules(db, result) {
  try {
    const rulesCollection = db.collection('approval_rules')

    const { data: existingRules } = await rulesCollection.where({}).get()
    for (const rule of existingRules) {
      await rulesCollection.doc(rule._id).remove()
      result.cleared.approval_rules = (result.cleared.approval_rules || 0) + 1
    }

    const defaultRule = {
      name: '默认手动审批',
      type: 'global',
      priority: 10,
      conditions: [],
      action: 'manual_approve',
      enabled: true,
      status: 1,
      isDefault: true,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const res = await rulesCollection.add({ data: defaultRule })
    result.approvalRules.push({ name: defaultRule.name, _id: res._id })
  } catch (err) {
    result.errors.push({ type: 'rule_create', name: '审批规则', message: err.message })
  }
}

async function createPublicResources(db, result) {
  try {
    const resourcesCollection = db.collection('public_resources')
    const existing = await resourcesCollection.where({ name: '移动投影仪' }).limit(1).get()

    if (existing.data.length === 0) {
      const resources = [
        {
          name: '移动投影仪',
          type: 'projector',
          description: '可移动投影仪，可在各会议室之间共享使用',
          location: 'A栋',
          totalQuantity: 2,
          availableQuantity: 2,
          status: 1,
          sort: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        },
        {
          name: '移动显示屏',
          type: 'monitor',
          description: '27寸移动显示屏，支持HDMI和无线投屏',
          location: 'A栋',
          totalQuantity: 1,
          availableQuantity: 1,
          status: 1,
          sort: 1,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      ]

      for (const resource of resources) {
        const res = await resourcesCollection.add({ data: resource })
        result.publicResources.push({ name: resource.name, _id: res._id })
      }
    } else {
      result.publicResources.push({ name: '移动投影仪', status: 'existed' })
      result.warnings.push({ type: 'resource_existed', name: '移动投影仪', message: '公共资源已存在，跳过创建' })
    }
  } catch (err) {
    result.errors.push({ type: 'resource_create', name: '公共资源', message: err.message })
  }
}

async function createPermissionTags(db, result) {
  try {
    const tagsCollection = db.collection('permission_tags')
    const tags = [
      {
        tagId: 'system',
        name: '系统管理员',
        tagName: '系统管理员',
        role: 'systemAdmin',
        description: '拥有所有权限，包含数据库管理',
        permissions: {
          canManageRooms: true,
          canDeleteRooms: true,
          canManagePublicResources: true,
          canApproveBookings: true,
          canViewAllUsers: true,
          canEditUsers: true,
          canManageApprovalRules: true,
          canManagePermissions: true,
          canManageSystem: true,
          canDatabaseManage: true,
          canAssignPermissionTags: true
        },
        isSystem: true
      },
      {
        tagId: 'super',
        name: '超级管理员',
        tagName: '超级管理员',
        role: 'superAdmin',
        description: '拥有除数据库管理外的所有权限',
        permissions: {
          canManageRooms: true,
          canDeleteRooms: true,
          canManagePublicResources: true,
          canApproveBookings: true,
          canViewAllUsers: true,
          canEditUsers: true,
          canManageApprovalRules: true,
          canManagePermissions: true,
          canManageSystem: true,
          canDatabaseManage: false,
          canAssignPermissionTags: true
        },
        isSystem: true
      },
      {
        tagId: 'academy',
        name: '书院管理人',
        tagName: '书院管理人',
        role: 'academyManager',
        description: '可增删改会议室、管理公共资源、审批预约、查看用户、管理审批规则',
        permissions: {
          canManageRooms: true,
          canDeleteRooms: true,
          canManagePublicResources: true,
          canApproveBookings: true,
          canViewAllUsers: true,
          canEditUsers: false,
          canManageApprovalRules: true,
          canManagePermissions: false,
          canManageSystem: false,
          canDatabaseManage: false,
          canAssignPermissionTags: false
        },
        isSystem: true
      },
      {
        tagId: 'approval',
        name: '审批管理人',
        tagName: '审批管理人',
        role: 'approvalManager',
        description: '仅可审批预约',
        permissions: {
          canManageRooms: false,
          canDeleteRooms: false,
          canManagePublicResources: false,
          canApproveBookings: true,
          canViewAllUsers: false,
          canEditUsers: false,
          canManageApprovalRules: false,
          canManagePermissions: false,
          canManageSystem: false,
          canDatabaseManage: false,
          canAssignPermissionTags: false
        },
        isSystem: true
      }
    ]

    const now = db.serverDate()
    let created = 0
    let skipped = 0

    for (const tag of tags) {
      const { data: existing } = await tagsCollection
        .where(db.command.or([{ tagId: tag.tagId }, { name: tag.name }]))
        .limit(1)
        .get()

      if (existing.length > 0) {
        skipped++
      } else {
        const res = await tagsCollection.add({
          data: { ...tag, createTime: now, updateTime: now }
        })
        result.permissionTags.push({ name: tag.name, _id: res._id })
        created++
      }
    }

    if (skipped > 0) {
      result.warnings.push({ type: 'tag_skipped', message: `${skipped} 个权限标签已存在，跳过创建` })
    }
  } catch (err) {
    result.errors.push({ type: 'tag_create', name: '权限标签', message: err.message })
  }
}

module.exports = initDatabase
