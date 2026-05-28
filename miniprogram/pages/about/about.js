/**
 * @file 关于页面
 * @description 展示小程序信息、备案信息
 * @author 红芯通开发团队
 * @since 2026-05-06
 * @version 1.0.0
 */

const ThemeMixin = require('../../theme/theme-mixin')
const { APP_NAME, APP_VERSION, APP_DESCRIPTION, APP_ICP, LOGO_URL } = require('../../config/constants')

Page({
  ...ThemeMixin,

  data: {
    theme: {},
    logoUrl: LOGO_URL,
    appInfo: {
      name: APP_NAME,
      version: `v${APP_VERSION}`,
      developer: '深职大集成电路学院',
      description: APP_DESCRIPTION,
      icp: APP_ICP
    }
  },

  onLoad() {
    ThemeMixin.onLoad.call(this)
  },

  onShow() {
    ThemeMixin.onShow.call(this)
  }
})
