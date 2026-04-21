/**
 * 小程序应用配置
 * @description 小程序基础配置信息，包括AppID、功能开关、页面配置等
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

module.exports = {
  // ==================== 基础信息 ====================
  
  // 小程序 AppID
  // 请替换为实际的小程序 AppID
  appId: 'wx1234567890abcdef',
  
  // 小程序名称
  appName: '红芯通',
  
  // 小程序描述
  appDescription: '深职大集成电路学院生活服务小程序',
  
  // 版本号（与 app.json 中的 version 保持一致）
  version: '1.0.0',
  
  // 版本名称
  versionName: 'MVP版本',
  
  // ==================== 功能开关 ====================
  
  /**
   * 功能开关配置
   * 用于控制各功能的启用状态，便于灰度发布和版本管理
   */
  features: {
    // MVP版本功能（已启用）
    enableUserModule: true,              // 用户模块
    enableBookingModule: true,           // 会议室预约模块
    enableScheduleModule: true,          // 课表模块
    enableAdminModule: true,             // 管理后台模块
    
    // V1.1版本功能（待启用）
    enableForumModule: false,            // 论坛交流模块
    enableGradeQuery: false,             // 成绩查询模块
    enableNotification: false,           // 通知公告模块
    
    // V1.2版本功能（待启用）
    enableLostFound: false,              // 失物招领模块
    enableFitnessScore: false,           // 体测成绩模块
    
    // V1.3版本功能（待启用）
    enableCreditSystem: false,           // 信誉分系统
    enableDelayApply: false,             // 延时申请模块
    
    // V2.0版本功能（待启用）
    enableSchoolAuth: false,             // 学校统一身份认证
    enableThemeSwitch: false,            // 主题切换功能
    enableMultiCollege: false            // 多学院支持
  },

  // ==================== 页面配置 ====================
  
  /**
   * 页面配置
   * 定义各页面的基础信息和权限要求
   */
  pages: {
    // 首页
    index: {
      title: '首页',
      path: 'pages/index/index',
      auth: false,                       // 不需要登录
      tabBar: true,                      // 是否在TabBar中
      icon: 'icon-home'
    },
    
    // 预约页面
    booking: {
      title: '会议室预约',
      path: 'pages/booking/index',
      auth: true,                        // 需要登录
      tabBar: true,
      icon: 'icon-calendar'
    },
    
    // 课表页面
    schedule: {
      title: '课表',
      path: 'pages/schedule/index',
      auth: true,
      tabBar: true,
      icon: 'icon-schedule'
    },
    
    // 个人中心
    profile: {
      title: '我的',
      path: 'pages/profile/index',
      auth: true,
      tabBar: true,
      icon: 'icon-user'
    },
    
    // 管理后台（仅管理员可见）
    admin: {
      title: '管理后台',
      path: 'pages/admin/dashboard',
      auth: true,
      adminOnly: true,                   // 仅管理员可访问
      tabBar: false
    }
  },

  // ==================== 业务配置 ====================
  
  /**
   * 预约模块配置
   */
  booking: {
    // 预约时间配置
    timeRange: {
      start: '08:00',                    // 最早可预约时间
      end: '22:00',                      // 最晚可预约时间
      minDuration: 60,                   // 最小预约时长（分钟）
      maxDuration: 240,                  // 最大预约时长（分钟）
      timeSlotInterval: 30               // 时间段间隔（分钟）
    },
    
    // 预约规则
    rules: {
      advanceBookingHours: 2,            // 需提前几小时预约
      freeCancelHours: 2,                // 免费取消时间（开始前小时数）
      maxBookingsPerDay: 3,              // 每日最大预约数
      maxBookingsPerWeek: 10,            // 每周最大预约数
      
      // 需要审批的时间段
      needApprovalTimeSlots: [
            { start: '18:00', end: '22:00', days: [1, 2, 3, 4, 5] },  // 工作日18点后
            { start: '08:00', end: '22:00', days: [0, 6] }           // 周末全天
      ]
    }
  },

  /**
   * 信誉分系统配置（V1.3启用）
   */
  credit: {
    initialScore: 100,                   // 初始信誉分
    maxScore: 150,                       // 最高信誉分
    minScore: 0,                         // 最低信誉分
    
    // 等级划分
    levels: [
      { name: '优秀', min: 120, max: 150, color: '#52C41A' },
      { name: '良好', min: 90, max: 119, color: '#1890FF' },
      { name: '合格', min: 60, max: 89, color: '#FAAD14' },
      { name: '受限', min: 0, max: 59, color: '#FF4D4F' }
    ],
    
    // 权限阈值
    thresholds: {
      canBookRoom: 60,                   // 可预约会议室的最低分
      canApplyDelay: 80,                 // 可申请延时的最低分
      autoApproveDelay: 120,             // 延时申请自动通过的分数
      maxDelayHours: {                   // 不同分数段的最大延时时长
        '120+': 3,                       // 120分以上可延时3小时
        '80-119': 1,                     // 80-119分可延时1小时
        '0-79': 0                        // 80分以下不可延时
      }
    }
  },

  // ==================== 系统配置 ====================
  
  // 默认分页大小
  pageSize: 10,
  
  // 最大分页大小
  maxPageSize: 100,
  
  // 缓存过期时间（秒）
  cacheExpire: {
    userInfo: 3600,                      // 用户信息 1小时
    roomList: 300,                       // 会议室列表 5分钟
    roomDetail: 600,                     // 会议室详情 10分钟
    bookingList: 60,                     // 预约列表 1分钟
    schedule: 1800,                      // 课表 30分钟
    creditScore: 300                     // 信誉分 5分钟
  },
  
  // 请求超时时间（毫秒）
  requestTimeout: 10000,
  
  // 上传文件大小限制（MB）
  uploadMaxSize: 2,
  
  // 支持的图片格式
  allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif'],

  // ==================== UI配置 ====================
  
  // 默认主题
  defaultTheme: 'default',
  
  // 支持的日期格式
  dateFormat: 'YYYY-MM-DD',
  
  // 支持的时间格式
  timeFormat: 'HH:mm',
  
  // 完整日期时间格式
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss'
}
