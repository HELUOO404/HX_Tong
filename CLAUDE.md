# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"红芯通" (HX_Tong) is a WeChat Mini Program for meeting room booking at 深职大集成电路学院 (Shenzhen Polytechnic University, School of Integrated Circuits). The app name displayed to users is "芯预约". It uses WeChat Cloud Development (云开发) with no external backend server.

AppID: 见 `project.config.json`（本地文件，不入库）  
Cloud Environment ID: 见 `miniprogram/config/env.js`（本地文件，不入库）

## Development Environment

- **IDE**: WeChat Developer Tools (微信开发者工具)
- **Runtime**: WeChat Mini Program framework (not Node.js/npm for the frontend)
- **Cloud Functions**: Node.js with `wx-server-sdk`
- **No build step** for the miniprogram itself — files are loaded directly by the framework

### Deploying Cloud Functions

Each cloud function is deployed independently via WeChat Developer Tools:
1. Right-click the cloud function folder in `cloudfunctions/`
2. Select "上传并部署：云端安装依赖"

Cloud functions that have `node_modules` committed (e.g., `adminService`) can also use "上传并部署：所有文件".

### Installing Cloud Function Dependencies Locally

```bash
cd cloudfunctions/adminService && npm install
cd cloudfunctions/meetingroomService && npm install
cd cloudfunctions/userService && npm install
cd cloudfunctions/systemService && npm install
```

## Architecture

### Directory Structure

```
miniprogram/          # Frontend mini program code
  app.js              # Entry point — cloud init, theme init, user store init
  app.json            # Page routes and tab bar config
  config/             # Environment config (env.js) and constants
  pages/              # Page components (WXML/WXSS/JS/JSON per page)
  services/           # Service singletons wrapping cloud function calls
  stores/             # State management (UserStore, AdminStore)
  theme/              # Multi-theme system (theme-config, theme-utils, theme-mixin)
  utils/              # Shared utilities (permission.js, errorHandler.js, bookingCalendar.js)
  components/         # Reusable UI components
  逻辑层/services/    # ApiService — unified cloud function call layer
  数据互通层/config/  # Business rule config (global.config.js)

cloudfunctions/       # Backend cloud functions
  adminService/       # Admin operations (users, permissions, approval rules, resources)
  meetingroomService/ # Room CRUD, booking CRUD, time slot queries
  userService/        # User login, profile, credit score
  systemService/      # DB init, DB viewer (super-admin only)
```

### Cloud Function Routing Pattern

All cloud functions use the same dispatch pattern:
```javascript
// Client calls:
wx.cloud.callFunction({ name: 'serviceName', data: { action: 'action_name', params: {...} } })

// Server dispatches:
const handlers = { 'action_name': require('./handlers/...') }
exports.main = async (event) => { return handlers[event.action](event.params, cloud) }
```

Response format is always `{ code: number, message: string, data: any }`. Code 200 = success.

### Authentication & Permissions

- **User auth**: Implicit via `wx.cloud.callFunction` (WeChat provides openid automatically)
- **Admin auth**: Token-based. Admin token stored in `wx.getStorageSync('adminInfo').token`, injected as `params._token` on every admin call
- **Permission system**: Tag-based. Admins have `permissionTags[]`, each tag contains a `permissions` object with boolean flags (e.g., `canManageRooms`, `canApproveBookings`)
- **Permission hydration**: Cloud functions hydrate sparse permission tags by querying the `permission_tags` collection at runtime
- **Role hierarchy** (highest to lowest): `systemAdmin` > `superAdmin` > `academyManager` > `approvalManager` > `scheduleViewer`

### Service Layer (Frontend)

Two patterns coexist:
1. **Legacy services** (`miniprogram/services/`): `BookingService`, `RoomService`, `UserService`, `AdminService` — singleton classes calling cloud functions directly
2. **Unified ApiService** (`miniprogram/逻辑层/services/api.service.js`): Single entry point with namespaced methods (e.g., `api.meetingroom.booking.create(params)`)

Both use singleton pattern via `static getInstance()`.

### Theme System

Configurable multi-theme support defined in `miniprogram/theme/theme-config.js`. Themes are applied via CSS variables and a mixin pattern (`theme-mixin.js`). Theme ID stored in local storage.

### Key Database Collections

- `users` — user profiles, roles, permission tags
- `bookings` — reservation records with status workflow
- `meeting_rooms` — room definitions
- `admin_tokens` — session tokens for admin auth
- `permission_tags` — permission tag definitions
- `approval_rules` — configurable approval rules
- `public_resources` — shared resources (equipment, etc.)

## Conventions

- Language: All UI text, comments, and logs are in Chinese
- Indentation: 2 spaces (configured in project.config.json)
- Module system: CommonJS (`require`/`module.exports`) — no ES modules
- Singletons: Services and stores use `static getInstance()` pattern
- Cloud function handlers receive `(params, cloud)` and return `{ code, message, data }`
- Permission checks: Use `permission.hasPermission(tags, 'permissionKey')` on both frontend and backend
- Frontend permission util is at `miniprogram/utils/permission.js`; backend copies exist per cloud function at `utils/permission.js` and `utils/roleDefaults.js`
