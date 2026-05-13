/**
 * @file 主题混入
 * @description 页面主题混入，自动处理主题切换
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 2.0.0
 */

const { getCurrentThemeId, applyTheme, getTheme } = require('./theme-utils');

/**
 * 主题混入
 * 在页面中引入此混入，自动处理主题切换
 */
const ThemeMixin = {
  data: {
    theme: {},
    currentThemeId: ''
  },

  onLoad() {
    // 应用保存的主题
    const savedTheme = getCurrentThemeId();
    const theme = getTheme(savedTheme);
    
    this.setData({
      theme: theme.colors,
      currentThemeId: savedTheme
    });

    // 应用主题到导航栏和TabBar
    applyTheme(this, savedTheme);
  },

  onShow() {
    // 检查主题是否变化 - 从本地存储获取最新主题
    const savedTheme = getCurrentThemeId();
    if (savedTheme !== this.data.currentThemeId) {
      const theme = getTheme(savedTheme);
      this.setData({
        theme: theme.colors,
        currentThemeId: savedTheme
      });
    }
    
    // 在 TabBar 页面始终应用主题（确保 TabBar 样式正确）
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage ? currentPage.route : '';
    const tabBarPages = ['pages/index/index', 'pages/room/list', 'pages/profile/index'];
    
    if (tabBarPages.includes(route)) {
      applyTheme(this, getCurrentThemeId());
    }
  },

  /**
   * 主题变化回调
   * 其他页面切换主题时会触发此方法
   * @param {string} themeId - 主题ID
   */
  onThemeChange(themeId) {
    if (themeId && typeof themeId === 'string' && themeId !== this.data.currentThemeId) {
      const theme = getTheme(themeId);
      this.setData({
        theme: theme.colors,
        currentThemeId: themeId
      });
      applyTheme(this, themeId);
    }
  }
};

module.exports = ThemeMixin;
