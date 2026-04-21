/**
 * 敏感配置示例文件
 * @description 此文件包含敏感配置信息，仅供参考
 *              实际使用请复制此文件为 secrets.config.local.js 并填写真实值
 *              secrets.config.local.js 已添加到 .gitignore，不会被提交
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 * @warning 请勿将此文件中的敏感信息提交到版本控制！
 */

module.exports = {
  // ==================== 云开发配置 ====================
  
  /**
   * 云开发环境ID
   * 在微信开发者工具 - 云开发 - 设置 中获取
   */
  cloudEnvId: 'your-cloud-env-id-here',
  
  /**
   * 加密密钥
   * 用于敏感数据（如手机号）的加密存储
   * 请使用随机生成的32位字符串
   */
  encryptionKey: 'your-32-char-encryption-key-here',
  
  // ==================== 微信小程序配置 ====================
  
  /**
   * 微信小程序 AppSecret
   * 在微信公众平台 - 开发 - 开发管理 - 开发设置 中获取
   */
  appSecret: 'your-app-secret-here',
  
  // ==================== 第三方服务配置 ====================
  
  /**
   * 第三方服务密钥
   * 用于接入外部服务（如学校统一认证、短信服务等）
   */
  thirdParty: {
    // 学校统一身份认证（V2.0版本接入）
    schoolAuth: {
      enabled: false,
      appId: '',
      appSecret: '',
      authUrl: '',
      tokenUrl: '',
      userInfoUrl: ''
    },
    
    // 短信服务（如需短信通知功能）
    sms: {
      enabled: false,
      provider: '',                      // 服务商: aliyun/tencent
      accessKeyId: '',
      accessKeySecret: '',
      signName: '',                      // 短信签名
      templateCode: ''                   // 短信模板ID
    },
    
    // 推送服务（如需消息推送功能）
    push: {
      enabled: false,
      provider: '',
      appKey: '',
      masterSecret: ''
    }
  },

  // ==================== 管理员配置 ====================
  
  /**
   * 初始管理员账号
   * 用于系统初始化时创建管理员账号
   * 格式: 微信openid + 角色
   */
  adminAccounts: [
    {
      openid: 'admin-openid-1',
      role: 'superAdmin',                // superAdmin / admin
      remark: '系统管理员'
    }
  ],
  
  // ==================== 安全配置 ====================
  
  /**
   * 安全相关配置
   */
  security: {
    // 密码强度要求（如需密码功能）
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
    
    // 登录失败锁定
    maxLoginAttempts: 5,                 // 最大尝试次数
    lockDuration: 1800,                  // 锁定时间（秒）
    
    // Token配置
    tokenExpire: 7200,                   // Token过期时间（秒）
    refreshTokenExpire: 604800           // 刷新Token过期时间（秒）
  }
}
