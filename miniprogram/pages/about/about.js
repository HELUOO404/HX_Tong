/**
 * @file 关于页面
 * @description 展示小程序信息、备案信息
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 1.0.0
 */

const ThemeMixin = require('../../theme/theme-mixin')

Page({
  ...ThemeMixin,

  data: {
    theme: {},
    appInfo: {
      name: '红芯通',
      version: 'v2.1.0',
      developer: '深职大集成电路学院',
      description: '面向校园的会议室预约管理小程序'
    }
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  }
})
