/**
 * @file 获取微信手机号处理器
 * @description 通过微信getPhoneNumber接口获取用户手机号
 */

const response = require('../utils/response')

module.exports = async (params, cloud) => {
  const { cloudID } = params

  if (!cloudID) {
    return response.error(400, '缺少cloudID参数')
  }

  try {
    const result = await cloud.getOpenData({
      list: [cloudID]
    })

    if (result.list && result.list.length > 0 && result.list[0].data) {
      const phoneData = result.list[0].data
      const phoneNumber = phoneData.phoneNumber || phoneData.purePhoneNumber || ''

      if (phoneNumber) {
        return response.success({
          phoneNumber
        }, '获取手机号成功')
      }
    }

    return response.error(400, '解密手机号失败')
  } catch (error) {
    console.error('[userService.getPhone] 获取手机号失败:', error)
    return response.error(500, '获取手机号失败')
  }
}
