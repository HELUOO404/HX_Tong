/**
 * @file 参数校验工具
 */

exports.validateRequired = (params, fields) => {
  for (const field of fields) {
    if (!params[field]) {
      return { valid: false, message: `缺少必填参数: ${field}` }
    }
  }
  return { valid: true }
}

exports.validateTimeRange = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  if (start >= end) {
    return { valid: false, message: '结束时间必须晚于开始时间' }
  }
  return { valid: true }
}
