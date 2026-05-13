/**
 * @file 主题工具
 * @description 主题切换和管理工具
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 2.0.1
 */

const { THEMES, DEFAULT_THEME } = require('./theme-config');

const THEME_STORAGE_KEY = 'user_theme';

/**
 * 获取主题配置
 * @param {string} themeId - 主题ID
 * @returns {Object} 主题配置对象
 */
function getTheme(themeId) {
  return THEMES[themeId] || THEMES[DEFAULT_THEME];
}

/**
 * 获取当前主题ID
 * @returns {string} 当前主题ID
 */
function getCurrentThemeId() {
  return wx.getStorageSync(THEME_STORAGE_KEY) || DEFAULT_THEME;
}

/**
 * 保存主题偏好
 * @param {string} themeId - 主题ID
 */
function saveThemePreference(themeId) {
  wx.setStorageSync(THEME_STORAGE_KEY, themeId);
}

/**
 * 通知所有页面主题变化
 * @param {string} themeId - 主题ID
 */
function notifyThemeChange(themeId) {
  const pages = getCurrentPages();
  pages.forEach(page => {
    if (page.onThemeChange && typeof page.onThemeChange === 'function') {
      page.onThemeChange(themeId);
    }
  });
}

/**
 * 应用主题到页面
 * @param {Object} pageInstance - 页面实例
 * @param {string} themeId - 主题ID
 */
function applyTheme(pageInstance, themeId) {
  const theme = getTheme(themeId);

  // 设置页面数据
  if (pageInstance && pageInstance.setData) {
    pageInstance.setData({
      theme: theme.colors,
      currentThemeId: themeId
    });
  }

  // 设置导航栏颜色
  wx.setNavigationBarColor({
    frontColor: themeId === 'dark-pro' ? '#ffffff' : '#000000',
    backgroundColor: theme.colors.primary
  });

  // 设置 TabBar 颜色（只在 TabBar 页面设置）
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const route = currentPage ? currentPage.route : '';
  
  // 检查是否是 TabBar 页面
  const tabBarPages = ['pages/index/index', 'pages/room/list', 'pages/profile/index'];
  if (tabBarPages.includes(route)) {
    wx.setTabBarStyle({
      color: theme.colors.textTertiary,
      selectedColor: theme.colors.primary,
      backgroundColor: theme.colors.card,
      borderStyle: themeId === 'dark-pro' ? 'black' : 'white'
    });
  }
}

/**
 * 切换主题
 * @param {string} themeId - 主题ID
 * @returns {boolean} 是否切换成功
 */
function switchTheme(themeId) {
  if (!THEMES[themeId]) {
    console.error(`[Theme] 主题 ${themeId} 不存在`);
    return false;
  }

  // 保存主题偏好
  saveThemePreference(themeId);

  // 获取应用实例
  const app = getApp();
  if (app) {
    app.globalData.currentThemeId = themeId;
    app.globalData.theme = THEMES[themeId].colors;
  }

  // 应用主题到当前页面
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    applyTheme(currentPage, themeId);
  }

  // 通知所有页面主题已切换
  notifyThemeChange(themeId);

  return true;
}

/**
 * 初始化主题
 * @param {Object} app - 应用实例
 */
function initTheme(app) {
  let themeId = getCurrentThemeId();
  
  // 安全获取主题，如果存储的主题ID无效则使用默认主题
  const theme = getTheme(themeId);
  if (!theme || !theme.colors) {
    console.warn(`[Theme] 主题 ${themeId} 无效，使用默认主题`);
    themeId = DEFAULT_THEME;
  }

  if (app) {
    app.globalData.currentThemeId = themeId;
    app.globalData.theme = getTheme(themeId).colors;
  }

  // 应用主题到当前页面
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    applyTheme(currentPage, themeId);
  }
}

/**
 * 获取所有可用主题
 * @returns {Array} 主题列表
 */
function getAllThemes() {
  return Object.values(THEMES);
}

module.exports = {
  getTheme,
  getCurrentThemeId,
  saveThemePreference,
  applyTheme,
  switchTheme,
  initTheme,
  getAllThemes,
  THEMES,
  DEFAULT_THEME
};
