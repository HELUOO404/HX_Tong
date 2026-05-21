/**
 * @file 小程序应用入口
 * @description 红芯通小程序全局应用逻辑
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 2.0.0
 */

const { getConfig } = require('./config/env');
const UserStore = require('./stores/userStore');
const { initTheme, switchTheme: switchThemeUtil, getCurrentThemeId } = require('./theme/theme-utils');

App({
  globalData: {
    userInfo: null,
    isLogin: false,
    systemInfo: null,
    isConnected: true,
    theme: null,
    currentThemeId: ''
  },

  onLaunch() {
    console.log('[App] 小程序启动');
    
    // 初始化云开发
    this.initCloud();
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 初始化主题
    initTheme(this);
    
    // 初始化用户状态
    this.initUserStore();
    
    // 监听网络状态
    this.watchNetworkStatus();
  },

  onShow() {
    console.log('[App] 小程序显示');
    // 检查主题是否变化
    const currentThemeId = getCurrentThemeId();
    if (currentThemeId !== this.globalData.currentThemeId) {
      initTheme(this);
    }
  },

  onHide() {
    console.log('[App] 小程序隐藏');
  },

  onError(error) {
    console.error('[App] 全局错误:', error);
  },

  /**
   * 初始化云开发
   */
  initCloud() {
    if (!wx.cloud) {
      console.error('[App] 微信版本过低，不支持云开发');
      return;
    }
    
    const config = getConfig();
    wx.cloud.init({
      env: config.envId,
      traceUser: true
    });

    console.log('[App] 云开发初始化完成，环境:', config.env, '环境ID:', config.envId);
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      this.globalData.systemInfo = {
        ...windowInfo,
        ...deviceInfo,
        ...appBaseInfo
      };
      console.log('[App] 系统信息:', deviceInfo.model, deviceInfo.platform);
    } catch (error) {
      console.error('[App] 获取系统信息失败:', error);
    }
  },

  /**
   * 初始化用户状态管理
   */
  initUserStore() {
    const userStore = UserStore.getInstance();
    userStore.init().then(() => {
      console.log('[App] 用户状态初始化完成');
    }).catch(error => {
      console.error('[App] 用户状态初始化失败:', error);
    });
  },

  /**
   * 监听网络状态
   */
  watchNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      this.globalData.isConnected = res.isConnected;
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 切换主题
   * @param {string} themeId - 主题ID
   */
  switchTheme(themeId) {
    return switchThemeUtil(themeId);
  },

  /**
   * 获取全局数据
   */
  getGlobalData() {
    return this.globalData;
  }
});
