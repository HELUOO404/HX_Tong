/**
 * @file 信誉分页面
 * @description 展示用户信誉分和变动记录
 * @author 红芯通开发团队
 * @since 2026-04-21
 * @version 1.0.0
 */

const UserStore = require('../../stores/userStore')
const UserService = require('../../services/userService')
const { ErrorHandler } = require('../../utils/errorHandler')

Page({
  data: {
    creditScore: 100,
    creditLevel: '良好',
    records: [],
    isLoading: true,
    needLogin: false
  },

  onLoad() {
    const userStore = UserStore.getInstance()
    if (userStore.isLogin) {
      this.loadCreditInfo()
    } else {
      this.setData({ isLoading: false, needLogin: true })
    }
  },

  onPullDownRefresh() {
    if (this.data.needLogin) {
      wx.stopPullDownRefresh()
      return
    }
    this.loadCreditInfo().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载信誉分信息
   */
  async loadCreditInfo() {
    this.setData({ isLoading: true })

    try {
      const userService = UserService.getInstance()
      
      // 获取信誉分
      const creditData = await userService.getCreditScore()
      
      // 获取变动记录
      const recordsData = await userService.getCreditRecords(1, 20)

      // 计算等级
      let creditLevel = '良好'
      if (creditData.currentScore >= 120) {
        creditLevel = '优秀'
      } else if (creditData.currentScore >= 90) {
        creditLevel = '良好'
      } else if (creditData.currentScore >= 60) {
        creditLevel = '合格'
      } else {
        creditLevel = '受限'
      }

      this.setData({
        creditScore: creditData.currentScore,
        creditLevel,
        records: recordsData.list || [],
        isLoading: false
      })
    } catch (error) {
      ErrorHandler.handle(error)
      this.setData({ isLoading: false })
    }
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
