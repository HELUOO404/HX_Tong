/**
 * @file 预约成功页面
 * @description 展示预约结果
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    bookingId: '',
    status: ''
  },

  onLoad(options) {
    ThemeMixin.onLoad.call(this)
    const { bookingId, status } = options
    this.setData({ bookingId, status })
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  },

  /**
   * 查看预约详情
   */
  onViewDetail() {
    wx.redirectTo({
      url: `/pages/booking/detail?id=${this.data.bookingId}`
    })
  },

  /**
   * 返回首页
   */
  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
