const { success, error } = require('../utils/response')
const { invalidateToken } = require('../shared/verifyToken')

async function logout(params, cloud) {
  const admin = params._admin
  const token = params._token

  try {
    if (token) {
      await invalidateToken(token)
    }
    return success(null, '登出成功')
  } catch (err) {
    console.error('[adminService.logout] 登出失败:', err)
    return success(null, '登出成功')
  }
}

module.exports = logout
