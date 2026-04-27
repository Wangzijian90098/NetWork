# 前端 UI 全面重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端从当前设计全面重构为"星际科技风格"深色主题，包括创建设计系统组件库、重构布局组件、更新所有页面样式。

**Architecture:** 采用组件化设计系统模式，先建立基础组件（tokens、Button、Card、Input、Badge），再重构 Layout 布局，最后更新各页面。CSS 变量驱动主题，Lucide React 图标库。

**Tech Stack:** React 18, Tailwind CSS, Lucide React, CSS Variables, Vite

---

## 任务概览

| 阶段 | 任务数 | 说明 |
|------|--------|------|
| 第一阶段：设计系统基础 | 6 | tokens、动效、基础组件 |
| 第二阶段：布局组件重构 | 3 | Layout、Sidebar、Header |
| 第三阶段：页面重构 | 6 | Landing、Dashboard、APIKeys、Auth、Admin、Settings |
| 第四阶段：收尾 | 2 | 清理、README 更新 |

---

## 第一阶段：设计系统基础

### 任务 1: 创建设计令牌 (tokens.css)

**Files:**
- Create: `frontend/src/design-system/styles/tokens.css`
- Modify: `frontend/src/styles/globals.css` (移除旧变量)
- Delete: `frontend/src/styles/theme.css`

- [ ] **Step 1: 创建 tokens.css 设计令牌文件**

```css
/* ========================================
   AI NetWork Design System — Tokens
   星际科技风格设计系统
   ======================================== */

:root {
  /* 主背景 */
  --bg-primary: #000000;
  --bg-secondary: #0a0a0f;
  --bg-elevated: rgba(255, 255, 255, 0.03);
  --bg-glass: rgba(10, 10, 15, 0.8);

  /* 文字颜色 */
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* 边框颜色 */
  --border-default: rgba(255, 255, 255, 0.08);
  --border-glow: rgba(0, 212, 255, 0.2);
  --border-glow-hover: rgba(0, 212, 255, 0.5);

  /* 强调色 — 科技蓝 */
  --primary: #00d4ff;
  --primary-light: #33ddff;
  --primary-dark: #00a8cc;
  --primary-glow: rgba(0, 212, 255, 0.3);
  --primary-bg: rgba(0, 212, 255, 0.08);

  /* 辅助强调色 — 电紫色 */
  --secondary: #a855f7;
  --secondary-light: #c084fc;
  --secondary-dark: #9333ea;
  --secondary-glow: rgba(168, 85, 247, 0.3);
  --secondary-bg: rgba(168, 85, 247, 0.08);

  /* 渐变 */
  --gradient-primary: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  --gradient-glow: linear-gradient(135deg, rgba(0, 212, 255, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%);

  /* 状态色 */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.1);
  --success-glow: rgba(16, 185, 129, 0.3);

  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.1);
  --warning-glow: rgba(245, 158, 11, 0.3);

  --danger: #f43f5e;
  --danger-bg: rgba(244, 63, 94, 0.1);
  --danger-glow: rgba(244, 63, 94, 0.3);

  --info: #3b82f6;
  --info-bg: rgba(59, 130, 246, 0.1);
  --info-glow: rgba(59, 130, 246, 0.3);

  /* 阴影 */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 30px var(--primary-glow);
  --shadow-glow-strong: 0 0 40px var(--primary-glow), 0 0 80px rgba(168, 85, 247, 0.2);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* 字体 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* 布局 */
  --sidebar-width: 280px;
  --sidebar-collapsed: 80px;
  --header-height: 64px;

  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

- [ ] **Step 2: 创建 animations.css 动效文件**

```css
/* ========================================
   AI NetWork Design System — Animations
   ======================================== */

/* 入场动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 发光呼吸效果 */
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--primary-glow),
                0 0 40px rgba(168, 85, 247, 0.15);
  }
  50% {
    box-shadow: 0 0 30px var(--primary-glow),
                0 0 60px rgba(168, 85, 247, 0.25);
  }
}

@keyframes glowBreath {
  0%, 100% {
    box-shadow: 0 0 15px var(--primary-glow);
    border-color: var(--border-glow);
  }
  50% {
    box-shadow: 0 0 25px var(--primary-glow);
    border-color: var(--border-glow-hover);
  }
}

/* 浮动动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 旋转加载 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲点 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 数字滚动 */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 渐变流动 */
@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 动画类 */
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
.animate-fadeInScale { animation: fadeInScale 0.4s ease-out; }
.animate-slideInLeft { animation: slideInLeft 0.4s ease-out; }
.animate-glowPulse { animation: glowPulse 3s ease-in-out infinite; }
.animate-glowBreath { animation: glowBreath 2s ease-in-out infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-gradientFlow {
  background-size: 200% 200%;
  animation: gradientFlow 4s ease infinite;
}

/* 延迟类 */
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
```

- [ ] **Step 3: 创建 utilities.css 工具类文件**

```css
/* ========================================
   AI NetWork Design System — Utilities
   ======================================== */

/* 玻璃态效果 */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
}

.glass-strong {
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid var(--border-glow);
}

/* 发光效果 */
.glow-border {
  border: 1px solid var(--border-glow);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.glow-border:hover {
  border-color: var(--border-glow-hover);
  box-shadow: var(--shadow-glow);
}

.glow-text {
  text-shadow: 0 0 10px var(--primary-glow),
               0 0 20px rgba(0, 212, 255, 0.3);
}

.glow-box {
  box-shadow: var(--shadow-glow);
}

/* 渐变文字 */
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 渐变边框 */
.gradient-border-wrapper {
  position: relative;
  border-radius: var(--radius-lg);
}

.gradient-border-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: var(--gradient-primary);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  transition: opacity var(--transition-base);
}

.gradient-border-wrapper:hover::before {
  opacity: 1;
}

/* 顶部发光条 */
.glow-top-bar {
  position: relative;
}

.glow-top-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  opacity: 0.7;
  transition: opacity var(--transition-base);
}

.glow-top-bar:hover::before {
  opacity: 1;
}

/* 截断文本 */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 隐藏滚动条 */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Focus Ring */
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-primary),
              0 0 0 4px var(--primary);
}

/* 遮罩层 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 40;
}
```

- [ ] **Step 4: 更新 globals.css 引入新设计系统**

在 `frontend/src/styles/globals.css` 顶部添加：

```css
@import './design-system/styles/tokens.css';
@import './design-system/styles/animations.css';
@import './design-system/styles/utilities.css';

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

- [ ] **Step 5: 删除旧 theme.css**

删除 `frontend/src/styles/theme.css`

- [ ] **Step 6: 提交**

```bash
git add frontend/src/design-system/styles/
git add frontend/src/styles/globals.css
git rm frontend/src/styles/theme.css
git commit -m "feat(design-system): add design tokens, animations, and utilities"
```

---

### 任务 2: 创建 Button 按钮组件

**Files:**
- Create: `frontend/src/design-system/components/Button/Button.jsx`
- Create: `frontend/src/design-system/components/Button/Button.css`
- Create: `frontend/src/design-system/components/Button/index.js`

- [ ] **Step 1: 创建 Button.jsx**

```jsx
import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    loading && 'ds-button--loading',
    disabled && 'ds-button--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="ds-button__spinner" />
      ) : leftIcon ? (
        <span className="ds-button__icon ds-button__icon--left">{leftIcon}</span>
      ) : null}
      <span className="ds-button__text">{children}</span>
      {rightIcon && !loading && (
        <span className="ds-button__icon ds-button__icon--right">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
```

- [ ] **Step 2: 创建 Button.css**

```css
/* Button Component Styles */
.ds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.ds-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--primary);
}

/* Sizes */
.ds-button--sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.ds-button--md {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
}

.ds-button--lg {
  height: 48px;
  padding: 0 28px;
  font-size: 16px;
}

/* Primary Variant */
.ds-button--primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 14px var(--primary-glow),
              0 0 20px rgba(168, 85, 247, 0.2);
}

.ds-button--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--primary-glow),
              0 0 30px rgba(168, 85, 247, 0.3);
}

.ds-button--primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

/* Secondary Variant */
.ds-button--secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  box-shadow: 0 0 10px var(--primary-glow);
}

.ds-button--secondary:hover:not(:disabled) {
  background: var(--primary-bg);
  box-shadow: 0 0 20px var(--primary-glow);
  transform: translateY(-1px);
}

.ds-button--secondary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

/* Ghost Variant */
.ds-button--ghost {
  background: transparent;
  color: var(--text-secondary);
}

.ds-button--ghost:hover:not(:disabled) {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Danger Variant */
.ds-button--danger {
  background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 14px var(--danger-glow);
}

.ds-button--danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--danger-glow);
}

/* States */
.ds-button--disabled,
.ds-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.ds-button--loading {
  cursor: wait;
}

.ds-button__spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.ds-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ds-button__icon svg {
  width: 18px;
  height: 18px;
}
```

- [ ] **Step 3: 创建 index.js**

```js
export { default } from './Button';
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/design-system/components/Button/
git commit -m "feat(design-system): add Button component with variants"
```

---

### 任务 3: 创建 Card 卡片组件

**Files:**
- Create: `frontend/src/design-system/components/Card/Card.jsx`
- Create: `frontend/src/design-system/components/Card/Card.css`
- Create: `frontend/src/design-system/components/Card/index.js`

- [ ] **Step 1: 创建 Card.jsx**

```jsx
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  glow = false,
  hoverable = true,
  topBar = true,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-card',
    `ds-card--${variant}`,
    glow && 'ds-card--glow',
    hoverable && 'ds-card--hoverable',
    topBar && 'ds-card--top-bar',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`ds-card__header ${className}`}>{children}</div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`ds-card__body ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`ds-card__footer ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
```

- [ ] **Step 2: 创建 Card.css**

```css
/* Card Component Styles */
.ds-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

.ds-card--hoverable:hover {
  border-color: var(--border-glow);
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
}

.ds-card--glow {
  border-color: var(--border-glow);
  box-shadow: 0 0 20px var(--primary-glow);
}

.ds-card--top-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0.6;
  transition: opacity var(--transition-base);
}

.ds-card--top-bar:hover::before {
  opacity: 1;
}

.ds-card {
  position: relative;
}

/* Glass Variant */
.ds-card--glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Gradient Border Variant */
.ds-card--gradient-border {
  position: relative;
  background: var(--bg-elevated);
}

.ds-card--gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--gradient-primary);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.3;
  transition: opacity var(--transition-base);
}

.ds-card--gradient-border:hover::before {
  opacity: 0.8;
}

/* Card Parts */
.ds-card__header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-default);
}

.ds-card__body {
  padding: var(--space-lg);
}

.ds-card__footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-default);
}
```

- [ ] **Step 3: 创建 index.js**

```js
export { default } from './Card';
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/design-system/components/Card/
git commit -m "feat(design-system): add Card component with variants"
```

---

### 任务 4: 创建 Input 输入框组件

**Files:**
- Create: `frontend/src/design-system/components/Input/Input.jsx`
- Create: `frontend/src/design-system/components/Input/Input.css`
- Create: `frontend/src/design-system/components/Input/index.js`

- [ ] **Step 1: 创建 Input.jsx**

```jsx
import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const wrapperClasses = [
    'ds-input-wrapper',
    error && 'ds-input-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && <label className="ds-input__label">{label}</label>}
      <div className="ds-input__container">
        {leftIcon && <span className="ds-input__icon ds-input__icon--left">{leftIcon}</span>}
        <input
          ref={ref}
          className={`ds-input ${leftIcon ? 'ds-input--has-left-icon' : ''} ${rightIcon ? 'ds-input--has-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="ds-input__icon ds-input__icon--right">{rightIcon}</span>}
      </div>
      {error && <span className="ds-input__error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
```

- [ ] **Step 2: 创建 Input.css**

```css
/* Input Component Styles */
.ds-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ds-input__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.ds-input__container {
  position: relative;
  display: flex;
  align-items: center;
}

.ds-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-sans);
  transition: all var(--transition-fast);
}

.ds-input::placeholder {
  color: var(--text-muted);
}

.ds-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-bg),
              0 0 15px var(--primary-glow);
}

.ds-input--has-left-icon {
  padding-left: 44px;
}

.ds-input--has-right-icon {
  padding-right: 44px;
}

.ds-input__icon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--text-muted);
  pointer-events: none;
}

.ds-input__icon svg {
  width: 18px;
  height: 18px;
}

.ds-input__icon--left {
  left: 0;
}

.ds-input__icon--right {
  right: 0;
}

.ds-input__error {
  font-size: 12px;
  color: var(--danger);
}

/* Error State */
.ds-input-wrapper--error .ds-input {
  border-color: var(--danger);
}

.ds-input-wrapper--error .ds-input:focus {
  box-shadow: 0 0 0 3px var(--danger-bg),
              0 0 15px var(--danger-glow);
}

/* Disabled State */
.ds-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-elevated);
}
```

- [ ] **Step 3: 创建 index.js**

```js
export { default } from './Input';
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/design-system/components/Input/
git commit -m "feat(design-system): add Input component"
```

---

### 任务 5: 创建 Badge 标签组件

**Files:**
- Create: `frontend/src/design-system/components/Badge/Badge.jsx`
- Create: `frontend/src/design-system/components/Badge/Badge.css`
- Create: `frontend/src/design-system/components/Badge/index.js`

- [ ] **Step 1: 创建 Badge.jsx**

```jsx
import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  glow = false,
  dot = false,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-badge',
    `ds-badge--${variant}`,
    `ds-badge--${size}`,
    glow && 'ds-badge--glow',
    dot && 'ds-badge--dot',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className="ds-badge__dot" />}
      {children}
    </span>
  );
};

export default Badge;
```

- [ ] **Step 2: 创建 Badge.css**

```css
/* Badge Component Styles */
.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Sizes */
.ds-badge--sm {
  padding: 2px 8px;
  font-size: 11px;
}

.ds-badge--md {
  padding: 4px 12px;
  font-size: 12px;
}

.ds-badge--lg {
  padding: 6px 16px;
  font-size: 14px;
}

/* Variants */
.ds-badge--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.ds-badge--primary {
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.ds-badge--secondary {
  background: var(--secondary-bg);
  color: var(--secondary);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.ds-badge--success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.ds-badge--warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.ds-badge--danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(244, 63, 94, 0.3);
}

/* Glow Effect */
.ds-badge--glow {
  box-shadow: 0 0 10px currentColor;
}

/* Dot Indicator */
.ds-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}
```

- [ ] **Step 3: 创建 index.js**

```js
export { default } from './Badge';
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/design-system/components/Badge/
git commit -m "feat(design-system): add Badge component"
```

---

### 任务 6: 创建设计系统统一导出

**Files:**
- Create: `frontend/src/design-system/index.js`

- [ ] **Step 1: 创建 index.js**

```js
// Design System — Main Export
// 统一导出所有设计系统组件

export { default as Button } from './components/Button';
export { default as Card } from './components/Card';
export { default as Input } from './components/Input';
export { default as Badge } from './components/Badge';

// Design tokens are available via CSS variables
// Import './styles/tokens.css' in main entry point
```

- [ ] **Step 2: 更新 main.jsx 引入设计系统**

读取 `frontend/src/main.jsx`，在顶部添加：

```jsx
import './styles/globals.css';
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/design-system/index.js
git add frontend/src/main.jsx
git commit -m "feat(design-system): add design system main export"
```

---

## 第二阶段：布局组件重构

### 任务 7: 重构 Layout 布局组件

**Files:**
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/components/layout/Layout.css`

- [ ] **Step 1: 更新 Layout.jsx**

替换当前内容为：

```jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`layout__overlay ${sidebarOpen ? 'layout__overlay--active' : ''}`}
           onClick={() => setSidebarOpen(false)} />
      <div className="layout__main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
```

- [ ] **Step 2: 更新 Layout.css**

```css
/* Layout Styles */
.layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
}

.layout__main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.layout__content {
  flex: 1;
  padding: var(--space-lg);
  overflow-x: hidden;
}

.layout__overlay {
  display: none;
}

/* Mobile */
@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .layout__overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 99;
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-base);
  }

  .layout__overlay--active {
    opacity: 1;
    visibility: visible;
  }

  .layout__content {
    padding: var(--space-md);
    padding-top: calc(var(--header-height) + var(--space-md));
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/layout/Layout.jsx frontend/src/components/layout/Layout.css
git commit -m "refactor(layout): update Layout with new design system"
```

---

### 任务 8: 重构 Sidebar 侧边栏

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.jsx`
- Modify: `frontend/src/components/layout/Sidebar.css`

- [ ] **Step 1: 更新 Sidebar.jsx**

```jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Key,
  FileText,
  Settings,
  Shield,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/app/api-keys', icon: Key, label: 'API Keys' },
  { path: '/app/docs', icon: FileText, label: '文档' },
  { path: '/app/settings', icon: Settings, label: '设置' },
];

const adminItems = [
  { path: '/app/admin', icon: Shield, label: '管理后台', adminOnly: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__inner">
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span>N</span>
          </div>
          <span className="sidebar__title">AI NetWork</span>
          <button className="sidebar__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <div className="sidebar__divider" />
          )}
          {user?.role === 'admin' && adminItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar__link sidebar__link--admin ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              <User size={18} />
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || '用户'}</span>
              <span className="sidebar__user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="退出登录">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
```

- [ ] **Step 2: 更新 Sidebar.css**

```css
/* Sidebar Styles */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-glow);
  z-index: 100;
  transition: transform var(--transition-base);
}

.sidebar__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-lg);
}

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-bottom: var(--space-lg);
  margin-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-default);
}

.sidebar__logo {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: white;
  box-shadow: 0 4px 14px var(--primary-glow);
}

.sidebar__title {
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
  flex: 1;
}

.sidebar__close {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sidebar__close:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Navigation */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all var(--transition-fast);
  position: relative;
}

.sidebar__link:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.sidebar__link--active {
  background: var(--primary-bg);
  color: var(--primary);
}

.sidebar__link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--primary);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px var(--primary);
}

.sidebar__divider {
  height: 1px;
  background: var(--border-default);
  margin: var(--space-md) 0;
}

.sidebar__link--admin {
  color: var(--warning);
}

.sidebar__link--admin::after {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning);
  animation: pulse 2s infinite;
}

/* Footer */
.sidebar__footer {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-default);
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar__user-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-email {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__logout {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sidebar__logout:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

/* Mobile */
@media (max-width: 980px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar__close {
    display: flex;
  }
}

@media (min-width: 981px) {
  .sidebar {
    position: relative;
    transform: none !important;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/layout/Sidebar.jsx frontend/src/components/layout/Sidebar.css
git commit -m "refactor(layout): update Sidebar with new design"
```

---

### 任务 9: 重构 Header 顶栏

**Files:**
- Modify: `frontend/src/components/layout/Header.jsx`
- Modify: `frontend/src/components/layout/Header.css`

- [ ] **Step 1: 更新 Header.jsx**

```jsx
import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const pathNames = {
  '/app/dashboard': '仪表盘',
  '/app/api-keys': 'API Keys',
  '/app/docs': '文档',
  '/app/settings': '设置',
  '/app/admin': '管理后台',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const pageName = pathNames[location.pathname] || '页面';

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h1 className="header__title">{pageName}</h1>
      </div>
      <div className="header__right">
        <div className="header__search">
          <Search size={18} />
          <input type="text" placeholder="搜索..." />
        </div>
        <button className="header__icon-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
```

- [ ] **Step 2: 更新 Header.css**

```css
/* Header Styles */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-lg);
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glow);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header__left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header__menu-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.header__menu-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header__right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header__search {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.header__search:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 10px var(--primary-bg);
}

.header__search input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  width: 200px;
  outline: none;
}

.header__search input::placeholder {
  color: var(--text-muted);
}

.header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header__icon-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--border-glow);
  color: var(--text-primary);
  box-shadow: 0 0 15px var(--primary-glow);
}

/* Mobile */
@media (max-width: 980px) {
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 90;
  }

  .header__menu-btn {
    display: flex;
  }

  .header__search {
    display: none;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/layout/Header.jsx frontend/src/components/layout/Header.css
git commit -m "refactor(layout): update Header with new design"
```

---

## 第三阶段：页面重构

### 任务 10: 重构 Landing 落地页

**Files:**
- Modify: `frontend/src/pages/Landing/index.jsx`
- Modify: `frontend/src/pages/Landing/Landing.css`

- [ ] **Step 1: 更新 Landing.css**

替换全部样式为新设计：

```css
/* Landing Page — Stellar Tech Design */
.landing {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: var(--bg-primary);
}

/* Background Stars Effect */
.landing::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(0, 212, 255, 0.3), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(168, 85, 247, 0.2), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(2px 2px at 130px 80px, rgba(0, 212, 255, 0.2), transparent),
    radial-gradient(1px 1px at 160px 30px, rgba(255, 255, 255, 0.2), transparent);
  background-size: 200px 100px;
  animation: starsFloat 60s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes starsFloat {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}

/* Navigation */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glow);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
  color: var(--text-primary);
}

.brand-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: white;
  box-shadow: 0 4px 14px var(--primary-glow);
}

.nav-links {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 120px 24px 80px;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--primary-bg);
  border: 1px solid var(--primary);
  border-radius: var(--radius-full);
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease-out;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px var(--primary);
}

.hero h1 {
  font-size: clamp(36px, 8vw, 72px);
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
  color: var(--text-primary);
  animation: fadeInUp 0.7s ease-out;
}

.hero h1 .gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 18px;
  color: var(--text-muted);
  max-width: 600px;
  margin-bottom: 40px;
  animation: fadeInUp 0.8s ease-out;
}

.hero-actions {
  display: flex;
  gap: 16px;
  animation: fadeInUp 0.9s ease-out;
  margin-top: 32px;
}

/* Code Card */
.code-card {
  width: 100%;
  max-width: 600px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: fadeInUp 1s ease-out;
  box-shadow: 0 0 30px var(--primary-glow);
  margin-bottom: 32px;
}

.code-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-default);
}

.code-card-dots {
  display: flex;
  gap: 8px;
}

.code-card-dots .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.code-card-dots .dot-red { background: #ff5f57; }
.code-card-dots .dot-yellow { background: #febc2e; }
.code-card-dots .dot-green { background: #28c840; }

.code-card-title {
  flex: 1;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.code-card-copy {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.code-card-copy:hover {
  background: var(--primary-bg);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 15px var(--primary-glow);
}

.code-card-body {
  padding: 20px;
  margin: 0;
  background: rgba(0, 0, 0, 0.4);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--primary-light);
  overflow-x: auto;
  text-align: left;
}

.code-card-body code {
  display: block;
  white-space: pre;
}

/* Buttons */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px var(--primary-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--primary-glow), 0 0 30px rgba(168, 85, 247, 0.3);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-md);
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-bg);
  box-shadow: 0 0 20px var(--primary-glow);
}

/* Features Section */
.features-section {
  padding: 100px 48px;
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 48px;
  color: var(--text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
  transition: all var(--transition-base);
  position: relative;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
  box-shadow: var(--shadow-glow);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: var(--primary-bg);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: all var(--transition-base);
}

.feature-card:hover .feature-icon {
  box-shadow: 0 0 20px var(--primary-glow);
  transform: scale(1.1);
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.6;
}

/* Models Section */
.models-section {
  padding: 100px 48px;
  position: relative;
  z-index: 1;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.model-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  transition: all var(--transition-base);
}

.model-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
  box-shadow: 0 0 20px var(--primary-glow);
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--success-bg);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.offline {
  background: rgba(100, 116, 139, 0.2);
  color: var(--text-muted);
  border-color: var(--border-default);
}

.status-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.model-provider {
  color: var(--text-muted);
  font-size: 14px;
}

/* Footer */
.landing-footer {
  padding: 40px 48px;
  border-top: 1px solid var(--border-glow);
  text-align: center;
  background: var(--bg-glass);
}

.footer-content {
  color: var(--text-muted);
  font-size: 14px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .landing-nav {
    padding: 16px 20px;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .features-section,
  .models-section {
    padding: 60px 20px;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Landing/Landing.css
git commit -m "refactor(landing): apply stellar tech design"
```

---

### 任务 11: 重构 Dashboard 控制台

**Files:**
- Modify: `frontend/src/pages/Dashboard/Dashboard.css`

- [ ] **Step 1: 更新 Dashboard.css**

```css
/* Dashboard Page — Stellar Tech Design */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  animation: fadeIn 0.5s ease-out;
}

/* Welcome Section */
.welcome-header {
  margin-bottom: var(--space-md);
}

.welcome-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.welcome-header p {
  color: var(--text-muted);
  margin-top: 4px;
}

/* Loading */
.loading {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--text-muted);
  gap: var(--space-md);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-default);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Error */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  color: var(--danger);
  gap: var(--space-md);
}

.error-container button {
  padding: 8px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.error-container button:hover {
  background: var(--primary-bg);
  border-color: var(--primary);
}

/* Stats Grid */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 1200px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid-4 {
    grid-template-template-columns: 1fr;
  }
}

/* Metric Card */
.metric-card {
  padding: var(--space-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.metric-card:hover {
  border-color: var(--border-glow);
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
  transition: transform var(--transition-base);
  border: 1px solid var(--border-glow);
}

.metric-card:hover .metric-icon {
  transform: scale(1.1);
  box-shadow: 0 0 20px var(--primary-glow);
}

.metric-icon.secondary {
  background: var(--secondary-bg);
  color: var(--secondary);
  border-color: rgba(168, 85, 247, 0.3);
}

.metric-icon.warning {
  background: var(--warning-bg);
  color: var(--warning);
  border-color: rgba(245, 158, 11, 0.3);
}

.metric-icon.success {
  background: var(--success-bg);
  color: var(--success);
  border-color: rgba(16, 185, 129, 0.3);
}

.metric-label {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: var(--space-sm);
  font-weight: 500;
}

.metric-value {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 4px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  animation: countUp 0.5s ease-out;
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-sub {
  color: var(--text-muted);
  font-size: 13px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-lg);
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Panel */
.panel {
  padding: var(--space-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
  position: relative;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0.5;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.panel:nth-child(1) { animation-delay: 0.1s; }
.panel:nth-child(2) { animation-delay: 0.2s; }

.panel h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Chart Panel */
.chart-panel {
  animation: fadeIn 0.5s ease-out;
}

/* Quick Start */
.quick-start p {
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

/* Code Block */
.code-block {
  display: block;
  background: rgba(0, 0, 0, 0.4);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--primary-light);
  overflow-x: auto;
  font-family: var(--font-mono);
  border: 1px solid var(--border-glow);
}

/* Model Tags */
.tag {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--primary-bg);
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  list-style: none;
}

.model-list li {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.model-list li:hover {
  background: var(--primary-bg);
  border-color: var(--border-glow);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/Dashboard.css
git commit -m "refactor(dashboard): apply stellar tech design"
```

---

### 任务 12-15: 重构其他页面

按相同模式更新以下页面的 CSS 文件：

- [ ] **任务 12**: `pages/Auth/Auth.css`
- [ ] **任务 13**: `pages/APIKeys/APIKeys.css`
- [ ] **任务 14**: `pages/Admin/Admin.css`
- [ ] **任务 15**: `pages/Settings/Settings.css`

每个文件应用相同的"星际科技风格"设计原则：
- 深色背景 + 发光边框
- 渐变强调色
- 悬浮发光动效
- 毛玻璃效果

---

## 第四阶段：收尾

### 任务 16: 清理旧样式文件

**Files:**
- Delete: `frontend/src/components/common/ParticleBackground.css`

- [ ] **Step 1: 删除 ParticleBackground.css**

如果不再需要粒子背景效果，删除该文件并更新相关引用。

- [ ] **Step 2: 提交**

```bash
git rm frontend/src/components/common/ParticleBackground.css
git commit -m "chore: remove unused particle background"
```

---

### 任务 17: 更新 README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README.md 架构部分**

在 README.md 的"项目架构"部分添加 design-system 说明：

```markdown
## 项目架构

```
NetWork/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── design-system/  # 设计系统组件库
│   │   │   ├── components/ # Button, Card, Input, Badge
│   │   │   └── styles/     # tokens, animations, utilities
│   │   ├── components/     # 业务组件
│   │   ├── pages/          # 页面组件
│   │   ├── styles/         # 全局样式
│   │   └── ...
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: update README with design system architecture"
```

---

## 实施检查清单

完成所有任务后，执行以下验证：

- [ ] `npm run dev` 启动前端开发服务器
- [ ] 检查所有页面是否正常渲染
- [ ] 验证深色主题是否全局生效
- [ ] 测试按钮、卡片、输入框组件
- [ ] 测试悬浮动效和发光效果
- [ ] 验证响应式布局（桌面/平板/手机）
- [ ] 检查控制台是否有错误
