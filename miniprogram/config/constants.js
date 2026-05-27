/**
 * @file 常量定义
 * @description 全局常量配置
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

module.exports = {
  // 小程序信息
  APP_NAME: '芯预约',
  APP_VERSION: '2.1.0',
  APP_DESCRIPTION: '深职大集成电路学院会议室预约小程序',
  APP_ICP: '粤ICP备2026063430号-1X',
  LOGO_URL: '/assets/images/logo.png',

  // 分页配置
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // 缓存过期时间（秒）
  CACHE_EXPIRE: {
    USER_INFO: 3600,
    ROOM_LIST: 300,
    ROOM_DETAIL: 600,
    BOOKING_LIST: 60,
    CREDIT_SCORE: 300
  },

  // 请求超时时间（毫秒）
  REQUEST_TIMEOUT: 10000,

  // 上传文件大小限制（MB）
  UPLOAD_MAX_SIZE: 2,

  // 支持的图片格式
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif'],

  // 预约规则
  BOOKING_RULES: {
    OPEN_TIME: '08:00',
    CLOSE_TIME: '22:00',
    
    MIN_DURATION: 0.5,
    MAX_DURATION: 8,
    AUTO_APPROVE_DURATION: 4,
    
    ADVANCE_BOOKING_HOURS: 0.5,
    
    FREE_CANCEL_HOURS: 6
  },

  // 信誉分规则
  CREDIT_RULES: {
    INITIAL_SCORE: 100,
    MAX_SCORE: 150,
    
    BOOKING_THRESHOLD: 80,
    
    DAILY_RESTORE: {
      '80-90': 1,
      '90-100': 2
    },
    
    CANCEL_DEDUCTION: {
      '6+': 0,
      '3-6': -3,
      '1-3': -5,
      '1-': -10
    },
    
    NOSHOW_DEDUCTION: 10
  },

  // 签到规则
  SIGNIN_RULES: {
    // 签到时限（分钟）
    TIME_LIMIT: 15
  },

  // 预约状态
  BOOKING_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    NOSHOW: 'noShow'
  },

  // 预约状态文本
  BOOKING_STATUS_TEXT: {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成',
    noShow: '未签到'
  },

  // 用户角色
  USER_ROLE: {
    USER: 'user'
  },

  // 学院列表
  ACADEMIES: [
    '集成电路学院',
    '未来技术学院',
    '人工智能本科学院',
    '本科教育学院',
    '电子与信息工程学院',
    '人工智能学院',
    '机电工程学院',
    '经济学院',
    '管理学院',
    '数字传媒学院',
    '艺术设计学院',
    '商务外语学院',
    '材料与环境工程学院',
    '建筑工程学院',
    '食品药品学院',
    '数字创意与动画学院',
    '汽车与交通学院',
    '医学技术与护理学院',
    '职业技术教育学院',
    '马克思主义学院',
    '创新创业学院',
    '创新创意设计学院',
    '国际教育学院'
  ],

  // 集成电路学院班级列表
  IC_CLASSES: [
    '23电子本',
    '23通信本',
    '24电子本',
    '24通信本',
    '24集成电路本',
    '25电子本1',
    '25电子本2',
    '25通信本1',
    '25通信本2',
    '25集成电路本1',
    '25集成电路本2'
  ],

  // 权限标签配置
  PERMISSION_GROUPS: [
    {
      group: '会议室管理',
      items: [
        { key: 'canManageRooms', label: '管理会议室', desc: '新增、编辑会议室信息' },
        { key: 'canDeleteRooms', label: '删除会议室', desc: '删除已有会议室' }
      ]
    },
    {
      group: '资源管理',
      items: [
        { key: 'canManagePublicResources', label: '管理公共资源', desc: '增删改查公共资源' }
      ]
    },
    {
      group: '预约审批',
      items: [
        { key: 'canApproveBookings', label: '审批预约', desc: '审批/拒绝用户的预约申请' }
      ]
    },
    {
      group: '预约查看',
      items: [
        { key: 'canViewBookingDetails', label: '查看预约详情', desc: '在会议室安排中查看预约人及预约详情，不可审批、不可进入管理后台' }
      ]
    },
    {
      group: '用户管理',
      items: [
        { key: 'canViewAllUsers', label: '查看所有用户', desc: '查看全部用户信息（只读）' },
        { key: 'canEditUsers', label: '编辑用户', desc: '修改用户资料和信誉分' }
      ]
    },
    {
      group: '系统设置',
      items: [
        { key: 'canManageApprovalRules', label: '管理审批规则', desc: '新增/编辑/启停审批规则' },
        { key: 'canManagePermissions', label: '管理权限标签', desc: '创建/编辑/删除权限标签' },
        { key: 'canManageSystem', label: '管理系统配置', desc: '修改系统级配置' },
        { key: 'canDatabaseManage', label: '数据库管理', desc: '初始化/查看数据库' },
        { key: 'canAssignPermissionTags', label: '分配权限标签', desc: '为用户绑定/解绑权限标签' }
      ]
    }
  ],

  ROLE_OPTIONS: [
    { role: 'systemAdmin', label: '系统管理员', desc: '全部权限，含数据库管理' },
    { role: 'superAdmin', label: '超级管理员', desc: '除数据库管理外全部功能' },
    { role: 'academyManager', label: '书院管理人', desc: '管理会议室/资源/审批/用户查看' },
    { role: 'approvalManager', label: '审批管理人', desc: '仅审批预约' },
    { role: 'scheduleViewer', label: '会议安排查看员', desc: '查看会议室安排与预约详情，不可审批' },
    { role: 'custom', label: '自定义角色', desc: '自由组合权限配置' }
  ],

  // 审批拒绝快捷短语
  REJECT_QUICK_PHRASES: [
    '预约用途不明确',
    '申请信息填写不全',
    '事由不符合规定',
    '场地正在维护中',
    '昵称/备注/联系方式不完整'
  ],

  ROLE_PRESETS: {
    systemAdmin: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: true, canAssignPermissionTags: true },
    superAdmin: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: true, canManageApprovalRules: true, canManagePermissions: true, canManageSystem: true, canDatabaseManage: false, canAssignPermissionTags: true },
    academyManager: { canManageRooms: true, canDeleteRooms: true, canManagePublicResources: true, canApproveBookings: true, canViewAllUsers: true, canEditUsers: false, canManageApprovalRules: true, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false },
    approvalManager: { canManageRooms: false, canDeleteRooms: false, canManagePublicResources: false, canApproveBookings: true, canViewAllUsers: false, canEditUsers: false, canManageApprovalRules: false, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false },
    scheduleViewer: { canManageRooms: false, canDeleteRooms: false, canManagePublicResources: false, canApproveBookings: false, canViewBookingDetails: true, canViewAllUsers: false, canEditUsers: false, canManageApprovalRules: false, canManagePermissions: false, canManageSystem: false, canDatabaseManage: false, canAssignPermissionTags: false }
  }

}
