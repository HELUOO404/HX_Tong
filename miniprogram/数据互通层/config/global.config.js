/**
 * 全局业务配置文件
 * 所有业务规则、常量集中管理
 */

module.exports = {
  // 用户信息完善规则
  userProfile: {
    // 必填字段
    requiredFields: ['nickname'],

    // 字段验证规则
    validation: {
      nickname: {
        required: true,
        minLength: 1,
        maxLength: 20,
        message: '昵称不能为空且不超过20个字符'
      },
      remark: {
        required: false,
        maxLength: 200,
        message: '备注不能超过200个字符'
      }
    }
  },

  // 信誉分规则
  credit: {
    // 初始分值
    initialScore: 100,

    // 等级体系
    levels: {
      excellent: { min: 90, max: 100, name: '优秀', color: '#52C41A' },
      good: { min: 80, max: 89, name: '良好', color: '#1890FF' },
      normal: { min: 60, max: 79, name: '合格', color: '#FAAD14' },
      restricted: { min: 0, max: 59, name: '受限', color: '#FF4D4F' }
    },

    // 加分规则
    bonus: {
      onTime: { score: 2, desc: '按时履约' },
      noViolation30Days: { score: 5, desc: '连续30天无违规' },
      returnDevice: { score: 3, desc: '主动归还设备' }
    },

    // 扣分规则
    penalty: {
      noShow: { score: -10, desc: '预约未到（未取消）' },
      overtime15Min: { score: -5, desc: '超时未离场（15分钟内）' },
      violation: { score: -20, desc: '违规使用场地' },
      cancel6hPlus: { score: 0, desc: '取消预约（≥6小时前，免费取消）' },
      cancel3to6h: { score: -3, desc: '取消预约（3-6小时前，扣3分）' },
      cancel1to3h: { score: -5, desc: '取消预约（1-3小时前，扣5分）' },
      cancelLess1h: { score: -10, desc: '取消预约（<1小时前，扣10分）' }
    },

    // 最低可预约分数
    minBookingScore: 80
  },

  // 预约规则
  booking: {
    // 可预约时段
    hours: { start: 8, end: 22 },

    // 时长限制
    duration: { min: 0.5, max: 8 },

    // 提前预约时间（小时）
    advanceBookingHours: 0.5,

    // 免费取消时间（开始前小时数）
    freeCancelHours: 6,

    // 需要审批的时长阈值（小时）
    approvalThreshold: 4
  },

  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },

  // 缓存配置
  cache: {
    userInfo: 3600,      // 用户信息缓存1小时
    roomList: 300,       // 会议室列表缓存5分钟
    timeSlots: 60        // 时段缓存1分钟
  }
}
