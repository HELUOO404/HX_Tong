# 红芯通小程序 API 规范

> 文档版本：v3.0
> 更新日期：2026-04-25
> 适用范围：红芯通小程序全项目

---

## 一、API 命名规范

### 1.1 命名格式

**统一格式**：`{资源}_{动作}_{操作}`

| 部分 | 说明 | 示例 |
|------|------|------|
| **资源** | 业务模块名 | meetingroom, user, admin, system |
| **动作** | 业务类型 | booking, manage, query, login |
| **操作** | 具体操作 | create, update, delete, getList |

### 1.2 命名示例

```
# 会议室预约相关
meetingroom_booking_create          # 创建预约
meetingroom_booking_cancel          # 取消预约
meetingroom_booking_getMyList       # 获取我的预约列表
meetingroom_booking_getDetail       # 获取预约详情
meetingroom_booking_approve         # 审批预约
meetingroom_booking_signIn          # 签到

# 会议室管理相关
meetingroom_manage_create           # 创建会议室
meetingroom_manage_update           # 更新会议室
meetingroom_manage_delete           # 删除会议室
meetingroom_manage_getBookings      # 获取会议室预约记录

# 会议室查询相关
meetingroom_getList                 # 获取会议室列表
meetingroom_getDetail               # 获取会议室详情
meetingroom_getTimeSlots            # 获取可预约时段

# 用户相关
user_login                          # 用户登录
user_getInfo                        # 获取用户信息
user_updateInfo                     # 更新用户信息
user_completeProfile                # 完善用户信息
user_credit_getScore                # 获取信誉分
user_credit_getRecords              # 获取信誉分记录

# 管理员相关
admin_login                         # 管理员登录
admin_dashboard_getStats            # 获取仪表盘数据
admin_users_getList                 # 获取用户列表
admin_users_updateRole              # 更新用户角色

# 系统相关
system_db_init                      # 初始化数据库
system_db_view                      # 数据库查看
```

---

## 二、请求与响应规范

### 2.1 请求格式

```javascript
{
  action: 'meetingroom_booking_create',  // API 名称（必填）
  params: {                               // 业务参数（根据 API 不同）
    roomId: 'xxx',
    date: '2026-04-22',
    startTime: '09:00',
    endTime: '11:00'
  }
}
```

### 2.2 响应格式

```javascript
{
  code: 200,           // 状态码（必填）
  message: '成功',     // 消息说明（必填）
  data: {}             // 业务数据（可选）
}
```

### 2.3 状态码规范

| 状态码 | 说明 | 使用场景 |
|-------|------|---------|
| 200 | 成功 | 请求处理成功 |
| 400 | 请求参数错误 | 参数缺失、格式不正确 |
| 401 | 未授权 | 用户未登录或登录已过期 |
| 403 | 无权限 | 用户无权限执行此操作 |
| 404 | 资源不存在 | 请求的数据不存在 |
| 500 | 服务器内部错误 | 服务器异常 |

### 2.4 业务错误码

| 错误码 | 说明 | 适用场景 |
|-------|------|---------|
| 1001 | 时间冲突 | 预约时段已被占用 |
| 1002 | 参数格式不正确 | 日期格式、时间格式错误 |
| 1003 | 信誉分不足 | 用户信誉分低于预约要求 |
| 1004 | 记录不存在 | 预约记录、会议室记录不存在 |
| 1005 | 状态不允许 | 当前状态不允许此操作 |
| 1006 | 超出限制 | 超出预约时长、次数限制 |

---

## 三、云函数 API 清单

### 3.1 MeetingroomService（会议室服务）

**云函数名称**：`meetingroomService`

#### 预约相关 API

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `meetingroom_booking_create` | 创建会议室预约 | 登录用户 |
| `meetingroom_booking_cancel` | 取消预约 | 预约创建者/管理员 |
| `meetingroom_booking_getMyList` | 获取我的预约列表 | 登录用户 |
| `meetingroom_booking_getDetail` | 获取预约详情 | 登录用户 |
| `meetingroom_booking_approve` | 审批预约 | 管理员 |
| `meetingroom_booking_signIn` | 预约签到 | 预约创建者 |

#### 会议室管理 API

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `meetingroom_manage_create` | 创建会议室 | 管理员 |
| `meetingroom_manage_update` | 更新会议室 | 管理员 |
| `meetingroom_manage_delete` | 删除会议室 | 管理员 |
| `meetingroom_manage_getBookings` | 获取会议室预约记录 | 管理员 |

#### 会议室查询 API

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `meetingroom_getList` | 获取会议室列表 | 任意用户 |
| `meetingroom_getDetail` | 获取会议室详情 | 任意用户 |
| `meetingroom_getTimeSlots` | 获取可预约时段 | 任意用户 |

### 3.2 UserService（用户服务）

**云函数名称**：`userService`

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `user_login` | 用户登录 | 任意用户 |
| `user_getInfo` | 获取用户信息 | 登录用户 |
| `user_updateInfo` | 更新用户信息 | 登录用户 |
| `user_completeProfile` | 完善用户信息 | 登录用户 |
| `user_credit_getScore` | 获取信誉分 | 登录用户 |
| `user_credit_getRecords` | 获取信誉分记录 | 登录用户 |

### 3.3 AdminService（管理员服务）

**云函数名称**：`adminService`

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `admin_login` | 管理员登录 | 任意用户 |
| `admin_dashboard_getStats` | 获取仪表盘数据 | 管理员 |
| `admin_users_getList` | 获取用户列表 | 管理员 |
| `admin_users_updateRole` | 更新用户角色 | 超级管理员 |

### 3.4 SystemService（系统服务）

**云函数名称**：`systemService`

| API 名称 | 功能 | 权限 |
|---------|------|------|
| `system_db_init` | 初始化数据库 | 管理员 |
| `system_db_view` | 数据库查看 | 管理员 |

---

## 四、前端调用规范

### 4.1 统一 API 服务

所有前端 API 调用必须通过服务层：

```javascript
// services/bookingService.js

const API_BASE = require('../config/env')

class BookingService {
  static getInstance() {
    if (!BookingService._instance) {
      BookingService._instance = new BookingService()
    }
    return BookingService._instance
  }

  /**
   * 创建预约
   */
  async createBooking(bookingData) {
    const { result } = await wx.cloud.callFunction({
      name: 'meetingroomService',
      data: {
        action: 'meetingroom_booking_create',
        params: bookingData
      }
    })
    
    if (result.code !== 200) {
      throw new Error(result.message)
    }
    
    return result.data
  }
}

BookingService._instance = null
module.exports = BookingService
```

### 4.2 调用示例

```javascript
// 页面中调用 API
const BookingService = require('../../services/bookingService')

Page({
  async createBooking() {
    try {
      const bookingService = BookingService.getInstance()
      const result = await bookingService.createBooking({
        roomId: 'room_001',
        date: '2026-04-22',
        startTime: '09:00',
        endTime: '11:00',
        purpose: '项目讨论'
      })
      
      wx.showToast({ title: '预约成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  }
})
```

---

## 五、权限体系

### 5.1 角色定义

| 角色 | 标识 | 权限等级 | 说明 |
|------|------|---------|------|
| 超级管理员 | superAdmin | 0 | 所有权限 |
| 管理员 | admin | 5 | 会议室管理、预约审批、用户管理 |
| 普通用户 | user | 10 | 预约会议室、查看个人预约 |

### 5.2 权限检查

```javascript
// 云函数中检查权限
const { isAdmin, hasPermission } = require('../utils/permission')

async function someHandler(params, cloud) {
  const { OPENID } = cloud.getWXContext()

  // 获取用户信息
  const db = cloud.database()
  const { data: users } = await db.collection('users')
    .where({ openid: OPENID })
    .limit(1)
    .get()

  if (users.length === 0) {
    return { code: 401, message: '未登录' }
  }

  const user = users[0]

  // 检查是否为管理员
  if (!isAdmin(user.role)) {
    return { code: 403, message: '无权限' }
  }

  // 执行业务逻辑
  // ...
}
```

---

## 六、数据库字段规范（重要）

### 6.1 用户表（users）字段规范

**⚠️ 重要规范：用户表使用 `openid`（无下划线）作为用户标识字段**

| 字段名 | 说明 | 注意事项 |
|--------|------|----------|
| `openid` | 用户的 OpenID | **必须使用此字段存储和查询**，不要使用 `_openid` |
| `profileCompleted` | 信息完善状态 | 布尔值，false=待完善，true=已完善 |
| `_openid` | 云开发自动添加 | 云数据库自动维护，**不要用于业务查询** |

### 6.2 正确与错误的查询方式

```javascript
// ✅ 正确：使用 openid（无下划线）
const { data: users } = await db.collection('users')
  .where({ openid: OPENID })
  .get()

// ❌ 错误：使用 _openid（有下划线）
const { data: users } = await db.collection('users')
  .where({ _openid: OPENID })  // 这会找不到用户！
  .get()
```

### 6.3 为什么不能使用 _openid？

1. **存储位置不同**：
   - `openid`：在 `users` 表中我们自己存储的字段
   - `_openid`：云数据库自动为每条记录添加的系统字段

2. **查询问题**：
   - `userService` 的 `login` 云函数创建用户时存储的是 `openid`
   - 其他云函数如果用 `_openid` 查询，会找不到用户

3. **预约关联**：
   - `bookings` 表中的 `userId` 字段存储的是 `openid`（不是 `_id`）
   - 查询预约对应的用户信息时，必须用 `openid`

### 6.4 admins 表的特殊性

`admins` 表的查询可以使用 `_openid`（云数据库自动维护），因为管理员账号是通过管理员后台创建的，云数据库会自动填充 `_openid`。

```javascript
// admins 表查询（可以使用 _openid）
const { data: admins } = await db.collection('admins')
  .where({ _openid: OPENID })
  .get()
```

### 6.5 代码审查清单

在提交代码前，检查以下内容：

- [ ] 查询 `users` 表是否使用了 `openid` 字段
- [ ] 查询 `admins` 表是否使用了 `_openid` 字段
- [ ] 创建预约时 `userId` 是否存储的是 `openid`
- [ ] 批量查询用户时 `_.in()` 中的字段是否与存储字段一致

---

## 七、API 版本控制

### 6.1 版本策略

- 当前版本：v1
- 版本号包含在 action 中（未来需要时）
- 例如：`v2_meetingroom_booking_create`

### 6.2 兼容性保证

- 同一版本 API 保持向后兼容
- 重大变更发布新版本
- 旧版本 API 保留至少 3 个月

---

## 七、API 文档维护

### 7.1 文档位置

每个云函数目录下包含 `API_DOCUMENTATION.md`：

```
cloudfunctions/
├── meetingroomService/
│   ├── API_DOCUMENTATION.md    # API 文档
│   ├── index.js
│   └── handlers/
```

### 7.2 文档内容

```markdown
# meetingroomService API 文档

## meetingroom_booking_create

创建会议室预约

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| roomId | string | 是 | 会议室 ID |
| date | string | 是 | 预约日期 YYYY-MM-DD |
| startTime | string | 是 | 开始时间 HH:MM |
| endTime | string | 是 | 结束时间 HH:MM |
| purpose | string | 是 | 预约用途 |

### 响应数据

```json
{
  "code": 200,
  "message": "预约成功",
  "data": {
    "bookingId": "xxx",
    "status": "approved"
  }
}
```

### 错误码

- 1001: 时间冲突
- 1002: 参数错误
- 1003: 信誉分不足
```

---

## 修订记录

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| v3.0 | 2026-04-25 | 新增数据库字段规范（openid vs _openid），修复权限检查示例代码错误 | 红芯通开发团队 |
| v2.0 | 2026-04-22 | 全面重构，与项目现状保持一致 | 红芯通开发团队 |
| v1.0 | 2026-04-21 | 初始版本 | 红芯通开发团队 |

---

**文档结束**

*本文档由红芯通开发团队制定，所有项目成员必须严格遵守。*
