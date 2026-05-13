/**
 * @file userService 云函数主入口
 * @description 用户服务大合集，包含登录、用户信息、信誉分等功能
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 处理器映射
const handlers = {
  // 用户登录
  'user_login': require('./handlers/login'),

  // 用户信息
  'user_getInfo': require('./handlers/getInfo'),
  'user_updateInfo': require('./handlers/updateInfo'),
  'user_completeProfile': require('./handlers/completeProfile'),
  'user_cancel': require('./handlers/cancel'),

  'user_getPhone': require('./handlers/getPhone'),

  // 信誉分
  'user_credit_getScore': require('./handlers/credit').getScore,
  'user_credit_getRecords': require('./handlers/credit').getRecords,
}

exports.main = async (event, context) => {
  const { action, params = {} } = event
  
  // 参数校验
  if (!action) {
    return { code: 400, message: '缺少action参数', data: null }
  }
  
  // 查找处理器
  const handler = handlers[action]
  if (!handler) {
    return { code: 404, message: `未知的action: ${action}`, data: null }
  }
  
  try {
    // 执行处理器
    return await handler(params, cloud)
  } catch (error) {
    console.error(`[userService] ${action} 执行失败:`, error)
    return { 
      code: 500, 
      message: '服务器内部错误',
      data: null,
      error: error.message 
    }
  }
}
