/**
 * 环境配置文件
 * @description 包含不同环境的配置信息，集中管理云开发环境ID等配置
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const ENV = {
  // 开发环境
  development: {
    env: 'development',
    envId: 'your-dev-env-id',           // 云开发环境ID - 开发环境
    apiBaseUrl: '',                      // 云开发不需要单独的API地址
    debug: true,                         // 开启调试模式
    mock: false,                         // 是否启用Mock数据
    logLevel: 'debug'                    // 日志级别: debug/info/warn/error
  },

  // 体验版/测试环境
  trial: {
    env: 'trial',
    envId: 'your-trial-env-id',          // 云开发环境ID - 体验版环境
    apiBaseUrl: '',
    debug: true,
    mock: false,
    logLevel: 'info'
  },

  // 生产环境
  production: {
    env: 'production',
    envId: 'your-prod-env-id',           // 云开发环境ID - 生产环境
    apiBaseUrl: '',
    debug: false,                        // 关闭调试模式
    mock: false,
    logLevel: 'error'
  }
}

/**
 * 获取当前环境配置
 * 根据微信小程序的 accountInfo 自动判断当前环境
 */
function getCurrentEnv() {
  try {
    const accountInfo = wx.getAccountInfoSync()
    const envVersion = accountInfo.miniProgram.envVersion
    
    // envVersion 可能的值: develop(开发版), trial(体验版), release(正式版)
    switch (envVersion) {
      case 'develop':
        return 'development'
      case 'trial':
        return 'trial'
      case 'release':
        return 'production'
      default:
        return 'development'
    }
  } catch (error) {
    console.warn('[env.config] 获取环境信息失败，使用默认开发环境:', error)
    return 'development'
  }
}

/**
 * 获取当前环境配置
 */
function getConfig() {
  const currentEnv = getCurrentEnv()
  return ENV[currentEnv] || ENV.development
}

module.exports = {
  ENV,
  getConfig,
  getCurrentEnv,
  config: getConfig()
}
