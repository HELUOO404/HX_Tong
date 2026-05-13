# MeetingroomService API 文档

## 预约相关

### meetingroom_booking_create
创建会议室预约

**参数：**
| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| roomId | string | 是 | 会议室ID |
| date | string | 是 | 预约日期 YYYY-MM-DD |
| startTime | string | 是 | 开始时间 HH:MM |
| endTime | string | 是 | 结束时间 HH:MM |
| purpose | string | 是 | 预约用途 |
| attendees | number | 否 | 参与人数 |
| contactPhone | string | 否 | 联系电话 |

**返回：**
```json
{
  "code": 200,
  "message": "预约成功",
  "data": {
    "bookingId": "xxx",
    "status": "approved",
    "needApproval": false
  }
}
```

**错误码：**
- 1001: 时间冲突
- 1002: 参数错误

## 会议室查询

### meetingroom_getList
获取会议室列表

**返回：**
```json
{
  "code": 200,
  "message": "成功",
  "data": [...]
}
```
