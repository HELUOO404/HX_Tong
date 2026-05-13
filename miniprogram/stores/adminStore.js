/**
 * @file 管理员状态管理
 * @description 全局唯一的管理员信息存储中心
 * @author 红芯通开发团队
 * @since 2026-04-25
 * @version 1.0.0
 */

const AdminService = require('../services/adminService')
const { checkPermission, getRoleFromTags } = require('../utils/permission')

class AdminStore {
  constructor() {
    this._adminInfo = null
    this._isLogin = false
    this._permissions = []
    this._listeners = []
  }

  /**
   * 获取单例实例
   */
  static getInstance() {
    if (!AdminStore._instance) {
      AdminStore._instance = new AdminStore()
    }
    return AdminStore._instance
  }

  /**
   * 获取管理员信息（只读）
   */
  get adminInfo() {
    return this._adminInfo ? { ...this._adminInfo } : null
  }

  /**
   * 获取登录状态
   */
  get isLogin() {
    return this._isLogin
  }

  /**
   * 获取管理员ID
   */
  get adminId() {
    return this._adminInfo ? this._adminInfo._id : null
  }

  get openid() {
    return this._adminInfo ? this._adminInfo.openid : null
  }

  /**
   * 初始化管理员信息
   */
  async init() {
    try {
      const cachedAdmin = wx.getStorageSync('adminInfo')
      if (cachedAdmin) {
        this._adminInfo = cachedAdmin
        this._isLogin = true
        this._notifyListeners()
      }

      if (this._isLogin) {
        await this.refreshAdminInfo().catch(error => {
          if (error.message && (error.message.includes('用户不存在') || error.message.includes('未登录'))) {
            console.log('[AdminStore] 管理员未登录或登录已过期')
            this.logout()
          }
        })
      }
    } catch (error) {
      console.error('[AdminStore] 初始化失败:', error)
    }
  }

  /**
   * 设置管理员信息
   */
  _setAdminInfo(adminInfo) {
    this._adminInfo = adminInfo
    this._isLogin = !!adminInfo

    if (adminInfo) {
      wx.setStorageSync('adminInfo', adminInfo)
    } else {
      wx.removeStorageSync('adminInfo')
    }

    this._notifyListeners()
  }

  /**
   * 刷新管理员信息
   */
  async refreshAdminInfo() {
    try {
      const cachedAdmin = wx.getStorageSync('adminInfo')
      if (cachedAdmin) {
        this._setAdminInfo(cachedAdmin)
      }
      return cachedAdmin
    } catch (error) {
      console.error('[AdminStore] 刷新管理员信息失败:', error)
      throw error
    }
  }

  async login(username, password) {
    try {
      const adminService = AdminService.getInstance()
      const adminInfo = await adminService.login(username, password)
      this._setAdminInfo(adminInfo)
      return adminInfo
    } catch (error) {
      console.error('[AdminStore] 登录失败:', error)
      throw error
    }
  }

  /**
   * 登出
   */
  async logout() {
    try {
      const AdminService = require('../services/adminService')
      const adminService = AdminService.getInstance()
      await adminService.logout()
    } catch (e) {
      console.error('[AdminStore] 登出失败:', e)
      wx.removeStorageSync('adminInfo')
    }
    this._setAdminInfo(null)
  }

  /**
   * 检查是否为超级管理员
   */
  isSuperAdmin() {
    const role = this.getAdminRole()
    return role === 'systemAdmin' || role === 'superAdmin'
  }

  isAdmin() {
    return this._adminInfo && !!this._adminInfo.role
  }

  getAdminRole() {
    if (!this._adminInfo) return null
    const tagRole = getRoleFromTags(this._adminInfo.permissionTags)
    if (tagRole) return tagRole
    const validRoles = ['systemAdmin', 'superAdmin', 'academyManager', 'approvalManager']
    const role = this._adminInfo.role
    return validRoles.includes(role) ? role : null
  }

  getPermissionTags() {
    if (!this._adminInfo) return []
    return this._adminInfo.permissionTags || []
  }

  hasPermission(permission) {
    return checkPermission(this.adminInfo, permission)
  }

  /**
   * 订阅管理员信息变化
   */
  subscribe(callback) {
    this._listeners.push(callback)

    callback({
      adminInfo: this.adminInfo,
      isLogin: this.isLogin
    })

    return () => {
      const index = this._listeners.indexOf(callback)
      if (index > -1) {
        this._listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   */
  _notifyListeners() {
    const state = {
      adminInfo: this.adminInfo,
      isLogin: this.isLogin
    }

    this._listeners.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        console.error('[AdminStore] 监听器执行失败:', error)
      }
    })
  }
}

AdminStore._instance = null

module.exports = AdminStore
