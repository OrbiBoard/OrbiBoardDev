# OrbiBoard 插件开发文档

本文档总结了 OrbiBoard 插件系统的主程序接口 (`pluginApi`) 及其他交互方式。

## 1. 插件入口与生命周期

插件的主入口文件（通常是 `index.js`）需要导出特定的生命周期函数。

### 1.1 `init(api)`
当插件被加载并启用时调用。
*   **参数**: `api` (Object) - 核心插件 API 对象，详见下文。
*   **用途**: 初始化插件逻辑、注册事件监听、设置定时任务等。

### 1.2 `disabled()` (或 `__plugin_disabled__`)
当插件被禁用或卸载时调用。
*   **用途**: 清理资源、停止定时器、取消事件监听等。

### 1.3 导出函数 (Backend Functions)
插件可以导出供其他插件或主程序调用的后端函数。
*   **方式**: 导出 `functions` 对象或直接导出函数。
```javascript
exports.functions = {
    myFunction: (args) => { ... }
};
// 或者
exports.myFunction = (args) => { ... };
```

### 1.4 导出自动化事件定义
插件可以导出 `automationEvents` 数组，声明它可以触发的自动化事件。
```javascript
exports.automationEvents = [
    { id: 'event_id', name: 'Event Name', description: '...' }
];
```

---

## 2. 核心插件 API (`pluginApi`)

`pluginApi` 对象在 `init` 函数中传入，提供了一系列与主程序交互的方法。

### 2.1 函数调用 (Inter-Plugin Call)
调用其他插件或系统的后端函数。

*   **`call(targetPluginId, fnName, ...args)`**
    *   调用指定插件的函数。
    *   **参数**:
        *   `targetPluginId`: 目标插件 ID。
        *   `fnName`: 函数名。
        *   `args`: 参数列表。
    *   **返回**: Promise。

*   **`callByAction(actionId, ...args)`**
    *   通过动作 ID (Action ID) 调用对应的插件函数。
    *   **参数**: `actionId` (String), `args` (Any)。

*   **`callByBehavior(behaviorId, ...args)`**
    *   通过行为 ID (Behavior ID) 调用对应的插件函数。
    *   **参数**: `behaviorId` (String), `args` (Any)。

### 2.2 事件系统 (Event System)
发布和订阅全局事件。

*   **`emit(eventName, payload)`**
    *   发送全局事件。
    *   **参数**: `eventName` (String), `payload` (Object)。

*   **`registerAutomationEvents(events)`**
    *   动态注册可用于自动化流程的事件定义。
    *   **参数**: `events` (Array)。

### 2.3 组件管理 (Components)
管理和获取插件 UI 组件信息。

*   **`components.list(group)`**
    *   获取已安装的组件列表。
    *   **参数**: `group` (String, 可选) - 过滤组件分组。
    *   **返回**: 组件数组。

*   **`components.entryUrl(idOrName)`**
    *   获取指定组件的入口 HTML 文件 URL。
    *   **参数**: `idOrName` (String) - 组件 ID 或名称。
    *   **返回**: String (file:// URL)。

### 2.4 自动化集成 (Automation)

*   **`automation.registerMinuteTriggers(times, cb)`**
    *   注册分钟级定时触发器。
    *   **参数**:
        *   `times`: 触发时间配置。
        *   `cb`: 回调函数。

*   **`automation.clearMinuteTriggers()`**
    *   清除当前插件注册的所有定时触发器。

*   **`automation.createActionShortcut(options)`**
    *   为插件动作创建桌面快捷方式。
    *   **参数**: `options` (Object) - 包含动作 ID、图标等信息。

### 2.5 数据存储 (Store)
插件专属的持久化键值对存储。

*   **`store.get(key)`**: 获取配置值。
*   **`store.set(key, value)`**: 设置配置值。
*   **`store.getAll()`**: 获取所有配置。
*   **`store.setAll(obj)`**: 批量设置配置。

### 2.6 启动页控制 (Splash)

*   **`splash.setStatus(stage, message)`**
    *   更新启动页上的加载状态文本。
*   **`splash.progress(...)`**
    *   更新进度条（具体参数视实现而定）。

### 2.7 桌面集成 (Desktop)

*   **`desktop.attachToDesktop(browserWindow)`**
    *   将指定的 `BrowserWindow` 实例嵌入到桌面层（壁纸模式）。
    *   **注意**: 仅在 Windows 平台有效。

### 2.8 其他

*   **`getStudentColumnDefs()`**
    *   获取所有插件定义的“学生列表列”定义（用于特定教育场景插件）。

---

## 3. IPC 通信 (前端与后端交互)

插件的前端页面（如设置页、组件窗口）可以通过 Electron 的 IPC 机制与主进程交互。

### 3.1 前端调用后端
*   **通道**: `plugin:call`
*   **方法**: `ipcRenderer.invoke('plugin:call', { pluginId, fnName, args })`
*   **用途**: 调用插件导出的后端函数。

### 3.2 前端监听事件
*   **通道**: `plugin:event:subscribe`
*   **方法**: `ipcRenderer.send('plugin:event:subscribe', eventName)`
*   **接收**: 监听 `plugin:event:message` 通道接收事件数据。

### 3.3 后端调用前端
*   **通道**: `plugin:invoke`
*   **场景**: 主进程需要调用插件前端的逻辑时。
*   **前端处理**:
    ```javascript
    ipcRenderer.on('plugin:invoke', (event, { fnName, args }) => {
        // 执行前端逻辑
    });
    ```

---

## 4. 清单文件 (plugin.json)

`plugin.json` 描述了插件的元数据和能力。

*   **`main`**: 入口文件路径 (默认 `index.js`)。
*   **`actions`**: 定义插件提供的动作（可被自动化或其他插件调用）。
*   **`behaviors`**: 定义插件的行为接口。
*   **`components`**: 定义插件提供的 UI 组件（Widget）。
*   **`permissions`**: 声明所需权限。未声明 `permissions` 字段的旧插件默认拥有所有权限，但建议新开发插件显式声明。

### 权限列表
*   `desktop`: 允许使用 `api.desktop` 模块（如壁纸模式）。
*   `automation`: 允许使用 `api.automation` 模块（注册触发器、快捷方式）。
*   `launcher`: 允许控制应用启动器菜单。
*   `all`: 允许访问所有 API（不推荐，仅用于测试或受信任插件）。

