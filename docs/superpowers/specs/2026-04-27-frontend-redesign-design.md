# 前端 UI 全面重构 — 设计文档

> **作者：** 王子健
> **日期：** 2026-04-27
> **阶段：** 视觉风格现代化
> **状态：** 设计完成，待实施

---

## 一、设计理念

**主题：星际科技风格 — "深邃空间，数据星辰"**

将 AI 平台比作控制宇宙网络的星际指挥中心，打造科技感、高档的深色主题界面。

---

## 二、设计要素

### 2.1 背景系统

- 主背景：纯黑 → 深空灰渐变 (`#000000` → `#0a0a0f`)
- 稀疏星尘粒子效果（缓慢飘动的光点）
- 网格线背景（非常淡，用于某些面板）

### 2.2 色彩系统

```css
/* 主背景 */
--bg-primary: #000000;
--bg-secondary: #0a0a0f;
--bg-elevated: rgba(255,255,255,0.03);

/* 文字 */
--text-primary: #ffffff;
--text-secondary: #94a3b8;
--text-muted: #64748b;

/* 强调色 */
--primary: #00d4ff;        /* 科技蓝 */
--primary-glow: rgba(0,212,255,0.3);
--secondary: #a855f7;      /* 电紫色 */
--secondary-glow: rgba(168,85,247,0.3);

/* 状态色 */
--success: #10b981;
--warning: #f59e0b;
--danger: #f43f5e;
--info: #3b82f6;

/* 发光边框 */
--border-glow: rgba(0,212,255,0.2);
--border-glow-hover: rgba(0,212,255,0.5);
```

### 2.3 卡片设计

```
默认状态：
- 背景：rgba(255,255,255,0.03)
- 边框：1px solid rgba(0,212,255,0.2)
- 圆角：16px
- backdrop-filter: blur(20px)

悬浮状态：
- 边框：1px solid rgba(0,212,255,0.5)
- box-shadow: 0 0 30px rgba(0,212,255,0.15)
- transform: translateY(-4px)

装饰：顶部 2px 渐变发光条（蓝→紫）
```

### 2.4 按钮系统

| 变体 | 背景 | 边框 | 文字 | 阴影 |
|------|------|------|------|------|
| `primary` | 渐变蓝→紫 | 无 | 白色 | 发光 |
| `secondary` | 透明 | 发光蓝边 | 蓝 | 无 |
| `ghost` | 透明 | 无 | 灰 | 无 |
| `danger` | 渐变红 | 无 | 白色 | 发光红 |

**尺寸**：sm (32px) / md (40px) / lg (48px)

**状态**：default / hover（发光增强） / active（缩小） / disabled（50% 透明度） / loading（显示 spinner）

### 2.5 输入框

```
默认：透明背景 + 1px 发光边框
聚焦：边框发光增强 + 蓝色光晕
错误：红色边框 + 红色光晕
```

### 2.6 字体系统

```
主字体：Inter
等宽字体：JetBrains Mono

字重：
- 标题：700-800
- 正文：400-500
- 标签：600
```

---

## 三、目录结构

```
frontend/src/
├── design-system/           # 新增：设计系统
│   ├── components/         # 基础组件
│   │   ├── Button/         # 按钮
│   │   ├── Card/           # 卡片
│   │   ├── Input/          # 输入框
│   │   ├── Badge/          # 标签
│   │   ├── Modal/          # 模态框
│   │   ├── Tooltip/        # 提示
│   │   ├── Table/          # 表格
│   │   ├── Select/         # 选择器
│   │   └── Toggle/         # 开关
│   ├── styles/             # 设计令牌
│   │   ├── tokens.css      # CSS 变量定义
│   │   ├── animations.css  # 动画定义
│   │   └── utilities.css   # 工具类
│   └── index.js            # 统一导出
│
├── components/             # 现有组件
│   └── layout/             # 布局组件（Header, Sidebar, Layout）
│
└── pages/                  # 页面
```

---

## 四、Layout 布局

### Sidebar 侧边栏

```
背景：rgba(0,0,0,0.6) + 右侧 1px 发光边框
宽度：280px（可折叠至 80px）

导航项：
- 图标 + 文字，14px
- 悬浮：背景淡蓝发光
- 选中：蓝色背景 + 左侧 3px 发光指示条

底部：用户头像 + 设置/退出
```

### Header 顶栏

```
高度：64px
背景：半透明黑 + 底部 1px 发光线
内容：面包屑 + 搜索 + 通知 + 用户菜单
```

---

## 五、页面设计

### 5.1 Landing 落地页

- 星尘背景（稀疏粒子）
- Hero 区域：呼吸发光动画
- 代码卡片：霓虹边框
- 特性卡片：悬浮发光增强
- 模型展示卡片：状态指示灯 + 发光边框

### 5.2 Dashboard 控制台

- 统计卡片：顶部发光条 + 数字滚动动画
- 图表：发光线条 + 渐变填充
- 响应式网格：4列→2列→1列

### 5.3 API Keys 管理

- Key 列表：毛玻璃卡片
- 复制按钮：发光效果
- 创建按钮：渐变 + 外发光

### 5.4 认证页面

- 登录/注册：居中卡片 + 星尘背景
- 表单：发光边框输入框
- 按钮：主按钮渐变发光

### 5.5 Admin 管理后台

- 用户管理：表格 + 发光操作按钮
- 平台密钥：卡片列表
- 数据统计：图表卡片

---

## 六、动效系统

```css
/* 入场动画 */
.fade-in-up { animation: fadeInUp 0.5s ease-out; }
.fade-in-scale { animation: fadeInScale 0.4s ease-out; }

/* 悬浮动效 */
.hover-glow {
  transition: all 0.3s ease;
}
.hover-glow:hover {
  box-shadow: 0 0 30px rgba(0,212,255,0.3);
  border-color: rgba(0,212,255,0.5);
}

/* 发光呼吸 */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); }
  50% { box-shadow: 0 0 40px rgba(0,212,255,0.5); }
}

/* 数字滚动 */
@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 七、图标方案

使用 **Lucide React**

```
主要图标：stroke-width: 1.5
颜色：跟随文字色（默认 muted，选中 primary）
尺寸：20px（导航）/ 24px（功能）
```

---

## 八、迁移清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `design-system/styles/tokens.css` | 新建 | CSS 变量定义 |
| `design-system/styles/animations.css` | 新建 | 动效定义 |
| `design-system/components/Button/` | 新建 | 按钮组件 |
| `design-system/components/Card/` | 新建 | 卡片组件 |
| `design-system/components/Input/` | 新建 | 输入框组件 |
| `design-system/components/Badge/` | 新建 | 标签组件 |
| `design-system/index.js` | 新建 | 统一导出 |
| `styles/globals.css` | 修改 | 引入新设计系统 |
| `styles/theme.css` | 删除 | 合并到 tokens.css |
| `pages/Landing/` | 重构 | 使用新组件 |
| `pages/Dashboard/` | 重构 | 使用新组件 |
| `pages/APIKeys/` | 重构 | 使用新组件 |
| `pages/Auth/` | 重构 | 使用新组件 |
| `pages/Admin/` | 重构 | 使用新组件 |
| `components/layout/` | 重构 | Sidebar/Header |
| `README.md` | 更新 | 架构文档 |

---

## 九、技术依赖

```json
{
  "dependencies": {
    "lucide-react": "^0.400.0"
  }
}
```

---

## 十、预期效果

1. **视觉统一**：所有页面使用统一的设计系统
2. **科技感强**：发光效果、深色背景、粒子效果
3. **交互流畅**：悬浮动效、入场动画、数字滚动
4. **代码质量**：组件化、可复用、易维护
5. **响应式**：移动端、平板、桌面完美适配
