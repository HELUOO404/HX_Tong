/**
 * @file 修复管理员OPENID工具
 * @description 修复 admins 表中缺少 _openid 的问题
 */

const { success, error } = require('../utils/response')

async function fixAdminOpenid(params, cloud) {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  console.log('[fixAdminOpenid] 开始修复管理员 OPENID')
  console.log('[fixAdminOpenid] 当前 OPENID:', OPENID)

  try {
    // 查找所有 admins 记录
    const { data: allAdmins } = await db.collection('admins').get()
    console.log('[fixAdminOpenid] admins 表中共有', allAdmins.length, '条记录')
    console.log('[fixAdminOpenid] admins 记录:', JSON.stringify(allAdmins))

    // 检查每条记录是否有 _openid
    for (const admin of allAdmins) {
      console.log('[fixAdminOpenid] 检查管理员:', admin.username, '当前 _openid:', admin._openid)

      if (!admin._openid) {
        // 更新该管理员记录，添加 _openid
        await db.collection('admins').doc(admin._id).update({
          data: {
            _openid: OPENID,
            updateTime: db.serverDate()
          }
        })
        console.log('[fixAdminOpenid] 已更新管理员', admin.username, '的 _openid')
      }
    }

    // 验证修复结果
    const { data: updatedAdmins } = await db.collection('admins').get()
    console.log('[fixAdminOpenid] 修复后的 admins 记录:', JSON.stringify(updatedAdmins))

    return success({
      fixed: true,
      adminsCount: allAdmins.length,
      admins: updatedAdmins.map(a => ({
        _id: a._id,
        username: a.username,
        role: a.role,
        _openid: a._openid
      }))
    }, '修复成功')

  } catch (err) {
    console.error('[fixAdminOpenid] 修复失败:', err)
    return error(500, '修复失败: ' + err.message)
  }
}

module.exports = fixAdminOpenid
