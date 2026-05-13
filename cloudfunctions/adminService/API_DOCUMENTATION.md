# AdminService API 文档

管理员服务大合集云函数，提供管理员登录、仪表盘数据统计、用户管理等功能。

---

## 接口说明

所有接口通过统一的 `adminService` 云函数调用，通过 `action` 参数区分不同功能。

### 请求格式

```javascript
wx.cloud.callFunction({
  name: 'adminService',
  data: {
    action: 'admin_login',
    params: {
      username: 'admin',
      password: '123456'
    }
  }
})
```

### 响应格式

```json
{
  "code": 200,
  "message": "成功",
  "data": {}
}
```

**状态码说明：**
- `200` - 成功
- `400` - 参数错误
- `401` - 未授权/登录失败
- `403` - 无权限
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 1. 管理员登录

### admin_login

管理员账号密码登录验证。

**参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**

```json
{
  "action": "admin_login",
  "params": {
    "username": "admin",
    "password": "123456"
  }
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "adminId": "xxx",
    "username": "admin",
    "role": "superAdmin",
    "name": "管理员",
    "token": "xxx_1234567890"
  }
}
```

**错误码：**
- `400` - 用户名和密码不能为空
- `401` - 用户名或密码错误 / 账号已被禁用
- `500` - 管理员集合不存在，请先初始化数据库

---

## 2. 仪表盘数据

### admin_dashboard_getData

获取管理后台仪表盘统计数据和最近预约记录。

**参数：** 无

**请求示例：**

```json
{
  "action": "admin_dashboard_getData",
  "params": {}
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalRooms": 10,
      "totalBookings": 500,
      "pendingApprovals": 5,
      "todayBookings": 12
    },
    "recentBookings": [
      {
        "_id": "booking_xxx",
        "roomId": "room_xxx",
        "roomName": "会议室A",
        "userId": "user_xxx",
        "userName": "张三",
        "date": "2026-04-22",
        "startTime": "09:00",
        "endTime": "11:00",
        "purpose": "项目讨论",
        "status": "approved",
        "createTime": "2026-04-21T10:00:00.000Z"
      }
    ]
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| stats.totalUsers | number | 总用户数 |
| stats.totalRooms | number | 总会议室数 |
| stats.totalBookings | number | 预约总数 |
| stats.pendingApprovals | number | 待审批预约数 |
| stats.todayBookings | number | 今日预约数 |
| recentBookings | array | 最近10条预约记录 |

---

## 3. 用户管理

### admin_users_getList

获取用户列表，支持分页、角色筛选和关键词搜索。

**参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| role | string | 否 | 按角色筛选：user/admin/superAdmin |
| keyword | string | 否 | 搜索关键词（姓名/昵称/手机号） |

**请求示例：**

```json
{
  "action": "admin_users_getList",
  "params": {
    "page": 1,
    "pageSize": 20,
    "role": "user",
    "keyword": "张三"
  }
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "_id": "xxx",
        "_openid": "openid_xxx",
        "name": "张三",
        "nickName": "张三昵称",
        "avatarUrl": "https://xxx.jpg",
        "phone": "13800138000",
        "role": "user",
        "department": "技术部",
        "creditScore": 100,
        "createTime": "2026-04-01T00:00:00.000Z",
        "updateTime": "2026-04-20T00:00:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

---

### admin_users_updateRole

更新用户角色。

**参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID（_openid） |
| role | string | 是 | 新角色：user/admin/superAdmin |

**请求示例：**

```json
{
  "action": "admin_users_updateRole",
  "params": {
    "userId": "openid_xxx",
    "role": "admin"
  }
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "角色更新成功",
  "data": {
    "userId": "openid_xxx",
    "role": "admin",
    "updateTime": "2026-04-22T10:00:00.000Z"
  }
}
```

**错误码：**
- `400` - 缺少用户ID / 无效的角色类型
- `404` - 用户不存在

---

## 角色说明

| 角色 | 权限说明 |
|------|----------|
| user | 普通用户，可进行预约、查看自己的预约记录 |
| admin | 管理员，可审批预约、管理会议室 |
| superAdmin | 超级管理员，拥有所有权限，包括用户角色管理 |

---

## 调用示例

### 微信小程序端调用

```javascript
// 管理员登录
async function adminLogin(username, password) {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'adminService',
      data: {
        action: 'admin_login',
        params: { username, password }
      }
    })
    
    if (result.code === 200) {
      // 保存登录信息
      wx.setStorageSync('adminToken', result.data.token)
      wx.setStorageSync('adminInfo', result.data)
      return result.data
    } else {
      throw new Error(result.message)
    }
  } catch (err) {
    console.error('登录失败:', err)
    throw err
  }
}

// 获取仪表盘数据
async function getDashboardData() {
  const { result } = await wx.cloud.callFunction({
    name: 'adminService',
    data: {
      action: 'admin_dashboard_getData',
      params: {}
    }
  })
  return result.data
}

// 获取用户列表
async function getUserList(page = 1, pageSize = 20) {
  const { result } = await wx.cloud.callFunction({
    name: 'adminService',
    data: {
      action: 'admin_users_getList',
      params: { page, pageSize }
    }
  })
  return result.data
}

// 更新用户角色
async function updateUserRole(userId, role) {
  const { result } = await wx.cloud.callFunction({
    name: 'adminService',
    data: {
      action: 'admin_users_updateRole',
      params: { userId, role }
    }
  })
  return result
}
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-04-22 | 初始版本，实现登录、仪表盘、用户管理功能 |
