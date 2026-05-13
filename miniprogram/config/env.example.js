/**
 * @file 环境配置模板
 * @description 复制此文件为 env.js 并填入你的云开发环境ID
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const ENV = {
  development: {
    env: 'development',
    envId: 'your-env-id-here',
    apiBaseUrl: '',
    debug: true,
    mock: false,
    logLevel: 'debug'
  },

  trial: {
    env: 'trial',
    envId: 'your-trial-env-id',
    apiBaseUrl: '',
    debug: true,
    mock: false,
    logLevel: 'info'
  },

  production: {
    env: 'production',
    envId: 'your-prod-env-id',
    apiBaseUrl: '',
    debug: false,
    mock: false,
    logLevel: 'error'
  }
}

function getCurrentEnv() {
  try {
    const accountInfo = wx.getAccountInfoSync()
    const envVersion = accountInfo.miniProgram.envVersion

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
