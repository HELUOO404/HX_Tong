/**
 * @file 统一响应格式工具
 * @description 提供标准化的API响应格式
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 1.0.0
 */

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object} 标准成功响应格式
 */
exports.success = (data, message = '成功') => ({
  code: 200,
  message,
  data
})

/**
 * 错误响应
 * @param {number} code - 错误码
 * @param {string} message - 错误消息
 * @returns {Object} 标准错误响应格式
 */
exports.error = (code, message) => ({
  code,
  message,
  data: null
})

/**
 * 未授权响应
 * @returns {Object} 401响应
 */
exports.unauthorized = () => exports.error(401, '未授权')

/**
 * 无权限响应
 * @returns {Object} 403响应
 */
exports.forbidden = () => exports.error(403, '无权限')

/**
 * 资源不存在响应
 * @param {string} resource - 资源名称
 * @returns {Object} 404响应
 */
exports.notFound = (resource = '资源') => exports.error(404, `${resource}不存在`)

/**
 * 参数错误响应
 * @param {string} message - 错误消息
 * @returns {Object} 400响应
 */
exports.badRequest = (message = '参数错误') => exports.error(400, message)
