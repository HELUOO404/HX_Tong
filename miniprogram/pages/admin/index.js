/**
 * @file 管理后台首页
 * @description 根据用户权限标签动态显示管理功能菜单
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 2.0.0
 */

const { ErrorHandler } = require('../../utils/errorHandler')
const ThemeMixin = require('../../theme/theme-mixin')
const AdminService = require('../../services/adminService')
const { checkAdminAuth, filterMenuByPermission, ROLE_NAMES, getRoleFromTags } = require('../../utils/permission')

Page({
  ...ThemeMixin,

  data: {
    adminInfo: null,
    adminRole: '',
    roleName: '',
    menuList: [],
    theme: {},
    stats: { totalUsers: 0, totalBookings: 0, pendingApprovals: 0, todayBookings: 0 },
    recentBookings: []
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
    this.checkAdminAuth()
  },

  onShow() {
    ThemeMixin.onShow.call(this)
    if (wx.getStorageSync('adminInfo')) {
      this.loadDashboardData()
    }
  },

  async loadDashboardData() {
    try {
      const adminService = AdminService.getInstance()
      const data = await adminService.getDashboardData()
      this.setData({
        stats: data.stats || { totalUsers: 0, totalBookings: 0, pendingApprovals: 0, todayBookings: 0 },
        recentBookings: (data.recentBookings || []).map(b => ({
          ...b,
          statusText: { pending: '待审批', approved: '已通过', rejected: '已拒绝', cancelled: '已取消', completed: '已结束', expired: '已过期' }[b.status] || b.status
        }))
      })
    } catch (error) {
      console.error('[AdminIndex] 加载看板数据失败:', error)
      this.setData({
        stats: { totalUsers: 0, totalBookings: 0, pendingApprovals: 0, todayBookings: 0 },
        recentBookings: []
      })
    }
  },

  checkAdminAuth() {
    if (!checkAdminAuth()) return

    const adminInfo = wx.getStorageSync('adminInfo')
    const role = getRoleFromTags(adminInfo.permissionTags) || adminInfo.role
    const roleName = ROLE_NAMES[role] || '管理员'

    const menuList = filterMenuByPermission(adminInfo)

    this.setData({
      adminInfo,
      adminRole: role,
      roleName,
      adminRoleName: roleName,
      menuList
    })
  },

  onMenuTap(e) {
    const { id } = e.currentTarget.dataset
    const urlMap = {
      approvals: '/pages/admin/approvals',
      rooms: '/pages/admin/rooms',
      bookings: '/pages/admin/bookings',
      publicResources: '/pages/admin/public-resources',
      approvalRules: '/pages/admin/approval-rules',
      users: '/pages/admin/users',
      permissionTags: '/pages/admin/permission-tags',
      initdb: '/pages/admin/initdb'
    }

    const url = urlMap[id]
    if (url) {
      wx.navigateTo({ url })
    }
  },

  onLogout() {
    wx.removeStorageSync('adminInfo')
    wx.navigateBack()
  }
})
