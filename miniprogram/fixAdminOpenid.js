/**
 * 临时修复工具 - 在微信开发者工具控制台中运行此代码
 *
 * 使用方法：
 * 1. 在微信开发者工具中打开云开发控制台
 * 2. 在控制台中粘贴并执行以下代码
 */

// 调用修复云函数
wx.cloud.callFunction({
  name: 'adminService',
  data: {
    action: 'admin_fixOpenid',
    params: {}
  }
}).then(res => {
  console.log('修复结果:', res)
  if (res.result.code === 200) {
    console.log('修复成功！admins 表中的记录:', res.result.data.admins)
  } else {
    console.error('修复失败:', res.result.message)
  }
}).catch(err => {
  console.error('调用失败:', err)
})