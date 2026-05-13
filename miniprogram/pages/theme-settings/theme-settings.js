/**
 * @file 主题设置页面
 * @description 用户切换主题样式 - 支持热换肤
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 2.0.0
 */

const { getAllThemes, getCurrentThemeId, switchTheme, getTheme } = require('../../theme/theme-utils')
const ThemeMixin = require('../../theme/theme-mixin')

Page({
  // 引入主题混入
  ...ThemeMixin,

  data: {
    themes: [],
    currentThemeId: '',
    currentThemeName: ''
  },

  onLoad() {
    // 调用混入的 onLoad 来初始化主题
    ThemeMixin.onLoad.call(this)

    // 加载所有可用主题
    const themes = getAllThemes()
    const currentThemeId = getCurrentThemeId()
    const currentTheme = getTheme(currentThemeId)

    this.setData({
      themes,
      currentThemeId,
      currentThemeName: currentTheme.name
    })
  },

  onShow() {
    // 调用混入的 onShow 来检查主题变化
    ThemeMixin.onShow.call(this)

    // 更新当前主题ID
    const currentThemeId = getCurrentThemeId()
    const currentTheme = getTheme(currentThemeId)

    if (currentThemeId !== this.data.currentThemeId) {
      this.setData({
        currentThemeId,
        currentThemeName: currentTheme.name
      })
    }
  },

  /**
   * 主题变化回调 - 由 notifyThemeChange 触发
   * 当其他页面切换主题时会调用此方法
   * @param {string} themeId - 主题ID
   */
  onThemeChange(themeId) {
    // 调用混入的 onThemeChange
    ThemeMixin.onThemeChange.call(this, themeId)

    // 更新主题名称显示
    if (themeId && typeof themeId === 'string') {
      const theme = getTheme(themeId)
      this.setData({
        currentThemeName: theme.name
      })
    }
  },

  /**
   * 处理主题点击
   */
  handleThemeTap(e) {
    const { id } = e.currentTarget.dataset

    if (id === this.data.currentThemeId) {
      return
    }

    const theme = getTheme(id)

    // 切换主题
    switchTheme(id)

    // 更新当前页面数据
    this.setData({
      currentThemeId: id,
      currentThemeName: theme.name
    })

    wx.showToast({
      title: '切换成功',
      icon: 'success'
    })
  },

  /**
   * 预览主题效果
   */
  onPreviewTheme(e) {
    const { id } = e.currentTarget.dataset
    const theme = getTheme(id)

    wx.showModal({
      title: theme.name,
      content: `点击确定切换为${theme.name}主题`,
      confirmColor: theme.colors.primary,
      success: (res) => {
        if (res.confirm) {
          this.handleThemeTap(e)
        }
      }
    })
  }
})
