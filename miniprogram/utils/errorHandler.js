/**
 * @file 错误处理工具
 * @description 统一的错误处理机制
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

/**
 * 错误码定义
 */
const ErrorCode = {
  // 业务错误 (1000-1999)
  TIME_CONFLICT: { code: 1001, message: '该时间段已被预约' },
  INVALID_PARAMS: { code: 1002, message: '参数格式不正确' },
  INSUFFICIENT_CREDIT: { code: 1003, message: '信誉分不足，无法预约' },
  BOOKING_NOT_FOUND: { code: 1004, message: '预约记录不存在' },
  CANNOT_CANCEL: { code: 1005, message: '已超过可取消时间' },
  ALREADY_SIGNED: { code: 1006, message: '已签到，无需重复签到' },
  SIGNIN_TIMEOUT: { code: 1007, message: '已超过签到时间' },
  
  // 网络错误 (2000-2999)
  NETWORK_ERROR: { code: 2001, message: '网络连接失败，请检查网络' },
  REQUEST_TIMEOUT: { code: 2002, message: '请求超时，请稍后重试' },
  
  // 系统错误 (3000-3999)
  SERVER_ERROR: { code: 3001, message: '服务器繁忙，请稍后重试' },
  DATABASE_ERROR: { code: 3002, message: '数据操作失败' },
  
  // 权限错误 (4000-4999)
  NO_PERMISSION: { code: 4001, message: '暂无权限执行此操作' },
  NOT_LOGIN: { code: 4002, message: '请先登录' },
  TOKEN_EXPIRED: { code: 4003, message: '登录已过期，请重新登录' }
}

/**
 * 统一错误处理器
 */
class ErrorHandler {
  /**
   * 处理错误
   */
  static handle(error, options = {}) {
    const { showToast = true, fallback = null } = options
    
    // 记录错误日志
    this._logError(error)
    
    // 获取错误信息
    const errorInfo = this._parseError(error)
    
    // 显示提示
    if (showToast) {
      wx.showToast({
        title: errorInfo.message,
        icon: 'none',
        duration: 2000
      })
    }
    
    // 执行降级方案
    if (fallback) {
      fallback(errorInfo)
    }
    
    return errorInfo
  }

  /**
   * 解析错误
   */
  static _parseError(error) {
    // 如果是已定义的错误码
    if (error.code && ErrorCode[error.code]) {
      return ErrorCode[error.code]
    }
    
    // 云函数返回的错误
    if (error.errCode) {
      switch (error.errCode) {
        case -501001:
          return ErrorCode.DATABASE_ERROR
        case -502001:
          return ErrorCode.NETWORK_ERROR
        case -504002:
          return ErrorCode.REQUEST_TIMEOUT
        default:
          return { code: error.errCode, message: error.errMsg || '未知错误' }
      }
    }
    
    // 网络错误判断
    if (error.message) {
      if (error.message.includes('network') || error.message.includes('请求')) {
        return ErrorCode.NETWORK_ERROR
      }
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        return ErrorCode.REQUEST_TIMEOUT
      }
      if (error.message.includes('login') || error.message.includes('登录')) {
        return ErrorCode.NOT_LOGIN
      }
      
      // 业务错误关键词匹配
      if (error.message.includes('冲突') || error.message.includes('已被预约')) {
        return ErrorCode.TIME_CONFLICT
      }
      if (error.message.includes('信誉分')) {
        return ErrorCode.INSUFFICIENT_CREDIT
      }
      if (error.message.includes('取消')) {
        return ErrorCode.CANNOT_CANCEL
      }
      
      return { code: 9999, message: error.message }
    }
    
    // 默认错误
    return { code: 9999, message: '未知错误，请稍后重试' }
  }

  /**
   * 记录错误日志
   */
  static _logError(error) {
    console.error('[ErrorHandler]', error)
    // 可以在这里接入日志上报服务
  }

  /**
   * 显示错误提示
   */
  static showError(message, duration = 2000) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration
    })
  }

  /**
   * 显示成功提示
   */
  static showSuccess(message, duration = 1500) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration
    })
  }

  /**
   * 显示加载中
   */
  static showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true })
  }

  /**
   * 隐藏加载中
   */
  static hideLoading() {
    try {
      wx.hideLoading()
    } catch (e) {
      // 忽略未配对调用错误
    }
  }

  /**
   * 安全隐藏加载中（带状态检查）
   */
  static hideLoadingSafe(isLoading) {
    if (isLoading) {
      try {
        wx.hideLoading()
      } catch (e) {
        // 忽略错误
      }
    }
  }
}

module.exports = { ErrorHandler, ErrorCode }
