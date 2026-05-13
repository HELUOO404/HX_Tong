/**
 * @file 用户服务
 * @description 处理用户相关的业务逻辑
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.1.0
 */

const { ErrorHandler } = require('../utils/errorHandler')

class UserService {
  constructor() {
    this.db = wx.cloud.database()
    this.collection = this.db.collection('users')
  }

  static getInstance() {
    if (!UserService._instance) {
      UserService._instance = new UserService()
    }
    return UserService._instance
  }

  /**
   * 微信登录
   */
  async wxLogin() {
    try {
      // 获取微信登录凭证
      const { code } = await wx.login()
      
      // 调用聚合云函数 userService
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_login',
          params: { code }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '登录失败')
      }

      // 保存token
      if (result.data.token) {
        wx.setStorageSync('token', result.data.token)
      }

      return result.data.userInfo
    } catch (error) {
      console.error('[UserService] 微信登录失败:', error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_getInfo',
          params: {}
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取用户信息失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(updates) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_updateInfo',
          params: updates
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '更新用户信息失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 更新用户信息失败:', error)
      throw error
    }
  }

  /**
   * 完善用户信息（首次登录）
   */
  async completeProfile(profileData) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_completeProfile',
          params: profileData
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '完善信息失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 完善信息失败:', error)
      throw error
    }
  }

  /**
   * 取消注册（拒绝完善信息）
   */
  async cancelRegistration() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_cancel',
          params: {}
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '取消注册失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 取消注册失败:', error)
      throw error
    }
  }

  /**
   * 获取用户信誉分
   */
  async getCreditScore() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_credit_getScore',
          params: {}
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取信誉分失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 获取信誉分失败:', error)
      throw error
    }
  }

  /**
   * 获取信誉分变动记录
   */
  async getCreditRecords(page = 1, pageSize = 20) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'user_credit_getRecords',
          params: { page, pageSize }
        }
      })

      if (result.code !== 200) {
        throw new Error(result.message || '获取信誉分记录失败')
      }

      return result.data
    } catch (error) {
      console.error('[UserService] 获取信誉分记录失败:', error)
      throw error
    }
  }
}

UserService._instance = null

module.exports = UserService
