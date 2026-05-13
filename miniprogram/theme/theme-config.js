/**
 * @file 主题配置
 * @description 所有主题的颜色配置定义
 * @author 红芯通开发团队
 * @since 2026-04-22
 * @version 2.0.0
 */

/**
 * 主题配置
 * 所有主题的颜色值都定义在这里
 */
const THEMES = {
  // 默认蓝色主题
  'modern-blue': {
    id: 'modern-blue',
    name: '集成蓝',
    colors: {
      primary: '#1890FF',
      primaryLight: '#40A9FF',
      primaryDark: '#096DD9',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      background: '#F5F5F5',
      card: '#FFFFFF',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E8E8E8'
    }
  },

  // 深色主题
  'dark-pro': {
    id: 'dark-pro',
    name: '暗夜黑',
    colors: {
      primary: '#60A5FA',
      primaryLight: '#93C5FD',
      primaryDark: '#3B82F6',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#F87171',
      background: '#0F172A',
      card: '#1E293B',
      textPrimary: '#F1F5F9',
      textSecondary: '#CBD5E1',
      textTertiary: '#64748B',
      border: 'rgba(148, 163, 184, 0.2)'
    }
  },

  // 橙色主题
  'warm-orange': {
    id: 'warm-orange',
    name: '活力橙',
    colors: {
      primary: '#FA8C16',
      primaryLight: '#FFA940',
      primaryDark: '#D46B08',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      background: '#FFF7E6',
      card: '#FFFFFF',
      textPrimary: '#212121',
      textSecondary: '#616161',
      textTertiary: '#9E9E9E',
      border: '#FFD591'
    }
  },

  // 绿色主题
  'nature-green': {
    id: 'nature-green',
    name: '自然绿',
    colors: {
      primary: '#13C2C2',
      primaryLight: '#36CFC9',
      primaryDark: '#08979C',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#FF4D4F',
      background: '#E6FFFB',
      card: '#FFFFFF',
      textPrimary: '#212121',
      textSecondary: '#616161',
      textTertiary: '#9E9E9E',
      border: '#87E8DE'
    }
  }
};

const DEFAULT_THEME = 'modern-blue';

module.exports = {
  THEMES,
  DEFAULT_THEME
};
