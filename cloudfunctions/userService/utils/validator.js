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

exports.validateRealName = (realName) => {
  if (!realName) {
    return { valid: false, message: '姓名不能为空' }
  }
  const regex = /^[\u4e00-\u9fa5]{2,20}$/
  if (!regex.test(realName)) {
    return { valid: false, message: '姓名必须为2-20个汉字' }
  }
  return { valid: true }
}

exports.validateStudentId = (studentId) => {
  if (!studentId) {
    return { valid: false, message: '学号不能为空' }
  }
  const regex = /^[a-zA-Z0-9]{6,20}$/
  if (!regex.test(studentId)) {
    return { valid: false, message: '学号必须为6-20位数字或字母' }
  }
  return { valid: true }
}

exports.validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, message: '手机号不能为空' }
  }
  const regex = /^1[3-9]\d{9}$/
  if (!regex.test(phone)) {
    return { valid: false, message: '手机号格式不正确' }
  }
  return { valid: true }
}

exports.validateClassName = (className) => {
  if (!className) {
    return { valid: false, message: '班级不能为空' }
  }
  if (className.length < 2 || className.length > 50) {
    return { valid: false, message: '班级名称长度必须在2-50个字符之间' }
  }
  return { valid: true }
}
