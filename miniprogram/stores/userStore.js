/**
 * @file 用户状态管理
 * @description 全局唯一的用户信息存储中心
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 2.0.0
 */

const UserService = require('../services/userService')

const ADMIN_ROLES = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']

class UserStore {
  constructor() {
    this._userInfo = null
    this._isLogin = false
    this._isProfileCompleted = false
    this._listeners = []
  }

  static getInstance() {
    if (!UserStore._instance) {
      UserStore._instance = new UserStore()
    }
    return UserStore._instance
  }

  get userInfo() {
    return this._userInfo ? { ...this._userInfo } : null
  }

  get isLogin() {
    return this._isLogin && this._isProfileCompleted
  }

  get isRawLogin() {
    return this._isLogin
  }

  get isProfileCompleted() {
    return this._isProfileCompleted
  }

  get userId() {
    return this._userInfo ? this._userInfo._id : null
  }

  get userRole() {
    return this._userInfo ? this._userInfo.role : null
  }

  get openid() {
    return this._userInfo ? this._userInfo.openid : null
  }

  get creditScore() {
    return this._userInfo ? (this._userInfo.creditScore || 100) : 100
  }

  getPermissionTags() {
    if (!this._userInfo) return []
    return this._userInfo.permissionTags || []
  }

  getAdminRole() {
    const tags = this.getPermissionTags()
    if (tags && tags.length > 0) {
      const priority = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']
      for (const role of priority) {
        if (tags.some(tag => tag.role === role)) return role
      }
      if (this._hasAnyPermissionActive()) return 'custom'
    }
    return null
  }

  hasPermissionTag() {
    if (!!this.getAdminRole()) return true
    return this._hasAnyPermissionActive()
  }

  _hasAnyPermissionActive() {
    const tags = this.getPermissionTags()
    for (const tag of tags) {
      if (tag.permissions && typeof tag.permissions === 'object') {
        for (const key of Object.keys(tag.permissions)) {
          if (tag.permissions[key]) return true
        }
      }
    }
    return false
  }

  async init() {
    try {
      const cachedUser = wx.getStorageSync('userInfo')
      if (cachedUser) {
        if (cachedUser.profileCompleted === true) {
          this._userInfo = cachedUser
          this._isLogin = true
          this._isProfileCompleted = true
          this._notifyListeners()
        } else {
          console.log('[UserStore] 用户未完善信息，清除缓存')
          this.logout()
        }
      }

      if (this._isLogin) {
        await this.refreshUserInfo().catch(error => {
          if (error.message && (error.message.includes('用户不存在') || error.message.includes('未登录'))) {
            console.log('[UserStore] 用户未登录或登录已过期')
            this.logout()
          }
        })
      }
    } catch (error) {
      console.error('[UserStore] 初始化失败:', error)
    }
  }

  _setUserInfo(userInfo) {
    this._userInfo = userInfo
    this._isLogin = !!userInfo
    this._isProfileCompleted = userInfo && userInfo.profileCompleted === true

    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
    } else {
      wx.removeStorageSync('userInfo')
    }

    this._notifyListeners()
  }

  _setTempUserInfo(userInfo) {
    this._userInfo = userInfo
    this._isLogin = true
    this._isProfileCompleted = false

    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
    }

    this._notifyListeners()
  }

  async refreshUserInfo() {
    try {
      const userService = UserService.getInstance()
      const userInfo = await userService.getCurrentUser()

      // 兜底：如果头像仍是 cloud:// 格式，说明云函数未正确转换，尝试重新获取
      if (userInfo.avatarUrl && userInfo.avatarUrl.startsWith('cloud://')) {
        console.warn('[UserStore] 头像仍为 cloud:// 格式，尝试重新获取临时URL')
        try {
          const freshInfo = await userService.getCurrentUser()
          if (freshInfo.avatarUrl && !freshInfo.avatarUrl.startsWith('cloud://')) {
            userInfo.avatarUrl = freshInfo.avatarUrl
          } else {
            userInfo.avatarUrl = ''
          }
        } catch (e) {
          console.error('[UserStore] 重新获取头像失败:', e)
          userInfo.avatarUrl = ''
        }
      }

      this._setUserInfo(userInfo)
      return userInfo
    } catch (error) {
      console.error('[UserStore] 刷新用户信息失败:', error)
      throw error
    }
  }

  async updateUserInfo(updates) {
    try {
      const userService = UserService.getInstance()
      const updatedInfo = await userService.updateUser(updates)
      this._setUserInfo({ ...this._userInfo, ...updatedInfo })
      return updatedInfo
    } catch (error) {
      console.error('[UserStore] 更新用户信息失败:', error)
      throw error
    }
  }

  async login() {
    try {
      const userService = UserService.getInstance()
      const userInfo = await userService.wxLogin()

      if (userInfo.profileCompleted === true) {
        this._setUserInfo(userInfo)
      } else {
        this._setTempUserInfo(userInfo)
      }

      return userInfo
    } catch (error) {
      console.error('[UserStore] 登录失败:', error)
      throw error
    }
  }

  completeLogin(updatedInfo) {
    if (!this._userInfo) {
      console.error('[UserStore] 没有临时用户信息，无法完成登录')
      return
    }

    const newUserInfo = {
      ...this._userInfo,
      ...updatedInfo,
      profileCompleted: true
    }

    this._setUserInfo(newUserInfo)
    console.log('[UserStore] 用户完成信息完善，转为正式登录状态')
  }

  logout() {
    this._userInfo = null
    this._isLogin = false
    this._isProfileCompleted = false
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    wx.removeStorageSync('adminInfo')
    this._notifyListeners()
  }

  hasPermission(permission) {
    if (!this._userInfo) return false
    const tags = this.getPermissionTags()
    if (!tags || tags.length === 0) return false
    for (const tag of tags) {
      if (tag.permissions && tag.permissions[permission]) return true
    }
    return false
  }

  isAdmin() {
    return this.hasPermissionTag()
  }

  subscribe(callback) {
    this._listeners.push(callback)

    callback({
      userInfo: this.userInfo,
      isLogin: this.isLogin,
      isProfileCompleted: this.isProfileCompleted
    })

    return () => {
      const index = this._listeners.indexOf(callback)
      if (index > -1) {
        this._listeners.splice(index, 1)
      }
    }
  }

  _notifyListeners() {
    const state = {
      userInfo: this.userInfo,
      isLogin: this.isLogin,
      isProfileCompleted: this.isProfileCompleted
    }

    this._listeners.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        console.error('[UserStore] 监听器执行失败:', error)
      }
    })
  }
}

UserStore._instance = null

module.exports = UserStore
