/**
 * @file 统一响应格式工具
 */

exports.success = (data, message = '成功') => ({
  code: 200,
  message,
  data
})

exports.error = (code, message) => ({
  code,
  message,
  data: null
})

exports.unauthorized = () => exports.error(401, '未授权')
exports.forbidden = () => exports.error(403, '无权限')
exports.notFound = (resource = '资源') => exports.error(404, `${resource}不存在`)
