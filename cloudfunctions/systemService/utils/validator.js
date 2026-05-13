/**
 * @file 参数校验工具
 * @description 提供常用的参数校验功能
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 1.0.0
 */

/**
 * 校验必填参数
 * @param {Object} params - 参数对象
 * @param {string[]} fields - 必填字段列表
 * @returns {Object} 校验结果 { valid: boolean, message?: string }
 */
exports.validateRequired = (params, fields) => {
  for (const field of fields) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      return { valid: false, message: `缺少必填参数: ${field}` }
    }
  }
  return { valid: true }
}

/**
 * 校验时间范围
 * @param {string} startTime - 开始时间 (HH:MM)
 * @param {string} endTime - 结束时间 (HH:MM)
 * @returns {Object} 校验结果
 */
exports.validateTimeRange = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  if (start >= end) {
    return { valid: false, message: '结束时间必须晚于开始时间' }
  }
  return { valid: true }
}

/**
 * 校验日期格式
 * @param {string} date - 日期字符串
 * @returns {Object} 校验结果
 */
exports.validateDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return { valid: false, message: '日期格式错误，应为 YYYY-MM-DD' }
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return { valid: false, message: '无效的日期' }
  }
  return { valid: true }
}

/**
 * 校验手机号
 * @param {string} phone - 手机号
 * @returns {Object} 校验结果
 */
exports.validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '手机号格式错误' }
  }
  return { valid: true }
}

/**
 * 校验邮箱
 * @param {string} email - 邮箱地址
 * @returns {Object} 校验结果
 */
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: '邮箱格式错误' }
  }
  return { valid: true }
}
