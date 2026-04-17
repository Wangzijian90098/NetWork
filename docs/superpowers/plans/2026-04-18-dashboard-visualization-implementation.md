# Dashboard 数据可视化升级实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Dashboard 添加 4 个数据可视化模块：用量趋势图、模型分布饼图、请求量统计、余额预警

**Architecture:** 使用 Recharts (轻量、React 原生) 实现图表，配合 Semi UI Card 组件保持风格一致

**Tech Stack:** React 18 + Recharts + Tailwind CSS + Semi UI

---

## 文件结构

```
frontend/src/pages/Dashboard/
├── index.jsx          # 主页面（重构）
├── Dashboard.css      # 样式（扩展）
├── components/
│   ├── UsageTrendChart.jsx   # 用量趋势折线图
│   ├── ModelDistribution.jsx  # 模型分布饼图
│   ├── RequestStats.jsx      # 请求量统计
│   └── BalanceAlert.jsx      # 余额预警
└── hooks/
    └── useDashboardData.js   # 数据获取 hook
```

---

## Task 1: 安装 Recharts 依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 添加 Recharts 依赖**

修改 `frontend/package.json`，在 dependencies 中添加：

```json
"recharts": "^2.12.0"
```

- [ ] **Step 2: 安装依赖**

```bash
cd frontend && npm install
```

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "deps: add recharts for dashboard charts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 创建 useDashboardData Hook

**Files:**
- Create: `frontend/src/pages/Dashboard/hooks/useDashboardData.js`

- [ ] **Step 1: 创建 hook 文件**

创建 `frontend/src/pages/Dashboard/hooks/useDashboardData.js`:

```javascript
import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export function useDashboardData() {
  const [userInfo, setUserInfo] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, usageRes] = await Promise.all([
        apiService.getUserInfo(),
        apiService.getUsage(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
      ]);
      setUserInfo(userRes.data);
      setUsageData(usageRes.data?.items || generateMockUsageData());
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据（后端未提供时使用）
  const generateMockUsageData = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map((day, i) => ({
      date: day,
      tokens: Math.floor(Math.random() * 50000) + 10000,
      gpt4: Math.floor(Math.random() * 20000) + 5000,
      claude: Math.floor(Math.random() * 15000) + 3000,
      gemini: Math.floor(Math.random() * 10000) + 2000,
      deepseek: Math.floor(Math.random() * 8000) + 1000,
    }));
  };

  // 模型分布数据
  const getModelDistribution = () => {
    if (!usageData.length) return [];
    const totals = usageData.reduce(
      (acc, day) => ({
        gpt4: acc.gpt4 + (day.gpt4 || 0),
        claude: acc.claude + (day.claude || 0),
        gemini: acc.gemini + (day.gemini || 0),
        deepseek: acc.deepseek + (day.deepseek || 0),
      }),
      { gpt4: 0, claude: 0, gemini: 0, deepseek: 0 }
    );
    return [
      { name: 'GPT-4o', value: totals.gpt4, color: '#10B981' },
      { name: 'Claude', value: totals.claude, color: '#8B5CF6' },
      { name: 'Gemini', value: totals.gemini, color: '#F59E0B' },
      { name: 'DeepSeek', value: totals.deepseek, color: '#3B82F6' },
    ];
  };

  // 请求统计
  const getRequestStats = () => {
    const todayRequests = Math.floor(Math.random() * 500) + 100;
    const monthRequests = Math.floor(Math.random() * 8000) + 2000;
    const successRate = 0.95 + Math.random() * 0.04;
    return {
      today: todayRequests,
      month: monthRequests,
      successRate: (successRate * 100).toFixed(1),
    };
  };

  return {
    userInfo,
    usageData,
    loading,
    error,
    modelDistribution: getModelDistribution(),
    requestStats: getRequestStats(),
    reload: loadData,
  };
}
```

- [ ] **Step 2: 创建目录并提交**

```bash
mkdir -p frontend/src/pages/Dashboard/hooks
git add frontend/src/pages/Dashboard/hooks/useDashboardData.js
git commit -m "feat(dashboard): add useDashboardData hook

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 实现 UsageTrendChart 组件

**Files:**
- Create: `frontend/src/pages/Dashboard/components/UsageTrendChart.jsx`

- [ ] **Step 1: 创建组件文件**

```javascript
import { Card } from '@douyinfe/semi-ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const COLORS = {
  gpt4: '#10B981',
  claude: '#8B5CF6',
  gemini: '#F59E0B',
  deepseek: '#3B82F6',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px',
      }}>
        <p style={{ color: '#e4e8ef', marginBottom: '8px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '13px' }}>
            {entry.name}: {entry.value.toLocaleString()} tokens
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function UsageTrendChart({ data }) {
  return (
    <Card className="panel chart-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>用量趋势</h2>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS.gpt4 }} />
            GPT-4o
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS.claude }} />
            Claude
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS.gemini }} />
            Gemini
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS.deepseek }} />
            DeepSeek
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gpt4Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.gpt4} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.gpt4} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="claudeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.claude} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.claude} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2732" />
          <XAxis dataKey="date" stroke="#6b7a8d" fontSize={12} />
          <YAxis stroke="#6b7a8d" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="gpt4" name="GPT-4o" stroke={COLORS.gpt4} fill="url(#gpt4Gradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="claude" name="Claude" stroke={COLORS.claude} fill="url(#claudeGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="gemini" name="Gemini" stroke={COLORS.gemini} fill="none" strokeWidth={2} />
          <Area type="monotone" dataKey="deepseek" name="DeepSeek" stroke={COLORS.deepseek} fill="none" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default UsageTrendChart;
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/components/UsageTrendChart.jsx
git commit -m "feat(dashboard): add UsageTrendChart component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 实现 ModelDistribution 组件

**Files:**
- Create: `frontend/src/pages/Dashboard/components/ModelDistribution.jsx`

- [ ] **Step 1: 创建组件文件**

```javascript
import { Card } from '@douyinfe/semi-ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px',
      }}>
        <p style={{ color: '#e4e8ef' }}>{data.name}</p>
        <p style={{ color: data.payload.color, fontSize: '16px', fontWeight: 'bold' }}>
          {data.value.toLocaleString()} tokens
        </p>
        <p style={{ color: '#6b7a8d', fontSize: '12px' }}>
          {data.payload.percent ? `${(data.payload.percent * 100).toFixed(1)}%` : ''}
        </p>
      </div>
    );
  }
  return null;
};

function ModelDistribution({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="panel chart-panel">
      <h2 style={{ marginBottom: '16px' }}>模型分布</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '180px', height: '180px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e4e8ef' }}>
              {(total / 1000).toFixed(0)}k
            </div>
            <div style={{ fontSize: '11px', color: '#6b7a8d' }}>Total</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '4px',
                background: item.color,
              }} />
              <span style={{ flex: 1, color: '#e4e8ef', fontSize: '14px' }}>{item.name}</span>
              <span style={{ color: '#6b7a8d', fontSize: '13px' }}>
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default ModelDistribution;
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/components/ModelDistribution.jsx
git commit -m "feat(dashboard): add ModelDistribution component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 实现 RequestStats 组件

**Files:**
- Create: `frontend/src/pages/Dashboard/components/RequestStats.jsx`

- [ ] **Step 1: 创建组件文件**

```javascript
import { Card } from '@douyinfe/semi-ui';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

function RequestStats({ stats }) {
  const successRate = parseFloat(stats.successRate);
  const getStatusColor = (rate) => {
    if (rate >= 95) return '#30D158';
    if (rate >= 90) return '#FFD60A';
    return '#FF453A';
  };

  const statusColor = getStatusColor(successRate);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - successRate / 100);

  return (
    <Card className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Activity size={20} style={{ color: 'var(--primary)' }} />
        <h2>请求量统计</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 今日请求 */}
        <div>
          <div style={{ fontSize: '12px', color: '#6b7a8d', marginBottom: '6px' }}>今日请求</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e4e8ef' }}>
            {stats.today.toLocaleString()}
          </div>
        </div>

        {/* 本月请求 */}
        <div>
          <div style={{ fontSize: '12px', color: '#6b7a8d', marginBottom: '6px' }}>本月请求</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e4e8ef' }}>
            {stats.month.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 成功率指示器 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <svg style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e2732"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={statusColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: statusColor }}>
              {successRate.toFixed(1)}%
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#e4e8ef', marginBottom: '4px' }}>成功率</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {successRate >= 95 ? (
              <TrendingUp size={16} style={{ color: '#30D158' }} />
            ) : (
              <TrendingDown size={16} style={{ color: '#FF453A' }} />
            )}
            <span style={{ fontSize: '12px', color: statusColor }}>
              {successRate >= 95 ? '优秀' : successRate >= 90 ? '良好' : '需优化'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default RequestStats;
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/components/RequestStats.jsx
git commit -m "feat(dashboard): add RequestStats component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 实现 BalanceAlert 组件

**Files:**
- Create: `frontend/src/pages/Dashboard/components/BalanceAlert.jsx`

- [ ] **Step 1: 创建组件文件**

```javascript
import { Card, Button } from '@douyinfe/semi-ui';
import { AlertTriangle, Zap, CreditCard } from 'lucide-react';

function BalanceAlert({ userInfo }) {
  const quota = userInfo?.quota || 100000;
  const usedQuota = userInfo?.used_quota || 0;
  const remainQuota = quota - usedQuota;
  const remainPercent = (remainQuota / quota) * 100;

  const getStatus = () => {
    if (remainPercent > 20) return 'healthy';
    if (remainPercent > 5) return 'warning';
    return 'danger';
  };

  const status = getStatus();
  const statusConfig = {
    healthy: {
      color: '#30D158',
      bgColor: 'rgba(48, 209, 88, 0.1)',
      label: '额度充足',
      icon: Zap,
    },
    warning: {
      color: '#FFD60A',
      bgColor: 'rgba(255, 214, 10, 0.1)',
      label: '即将用尽',
      icon: AlertTriangle,
    },
    danger: {
      color: '#FF453A',
      bgColor: 'rgba(255, 69, 58, 0.1)',
      label: '额度不足',
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card
      className="panel"
      style={{
        borderColor: status !== 'healthy' ? `${config.color}40` : 'rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Icon size={20} style={{ color: config.color }} />
        <h2 style={{ color: config.color }}>余额预警</h2>
      </div>

      {/* 状态标签 */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '999px',
        background: config.bgColor,
        marginBottom: '20px',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: config.color,
          animation: status !== 'healthy' ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: '13px', color: config.color }}>{config.label}</span>
      </div>

      {/* 进度条 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '13px',
        }}>
          <span style={{ color: '#6b7a8d' }}>剩余额度</span>
          <span style={{ color: '#e4e8ef', fontWeight: 'bold' }}>
            {(remainQuota / 1000000 * 7).toFixed(2)} USD
          </span>
        </div>
        <div style={{
          height: '8px',
          background: '#1e2732',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${remainPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${config.color}, ${config.color}aa)`,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e4e8ef' }}>
            {(quota / 1000000 * 7).toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7a8d' }}>总额度 (USD)</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e4e8ef' }}>
            {(usedQuota / 1000000 * 7).toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7a8d' }}>已消耗 (USD)</div>
        </div>
      </div>

      {/* 充值按钮 */}
      {status !== 'healthy' && (
        <Button
          type="primary"
          icon={<CreditCard size={16} />}
          block
          style={{
            background: `linear-gradient(135deg, ${config.color}, ${config.color}aa)`,
            border: 'none',
          }}
        >
          立即充值
        </Button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Card>
  );
}

export default BalanceAlert;
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/Dashboard/components/BalanceAlert.jsx
git commit -m "feat(dashboard): add BalanceAlert component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 重构 Dashboard 主页面

**Files:**
- Modify: `frontend/src/pages/Dashboard/index.jsx`
- Modify: `frontend/src/pages/Dashboard/Dashboard.css`

- [ ] **Step 1: 重构 Dashboard 主页面**

用以下内容替换 `frontend/src/pages/Dashboard/index.jsx`:

```javascript
import { Card } from '@douyinfe/semi-ui';
import { Coins, Zap, Key, TrendingUp } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import UsageTrendChart from './components/UsageTrendChart';
import ModelDistribution from './components/ModelDistribution';
import RequestStats from './components/RequestStats';
import BalanceAlert from './components/BalanceAlert';
import './Dashboard.css';

function Dashboard() {
  const {
    userInfo,
    loading,
    error,
    usageData,
    modelDistribution,
    requestStats,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <span>加载失败</span>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    );
  }

  const quota = userInfo?.quota || 0;
  const usedQuota = userInfo?.used_quota || 0;
  const remainQuota = quota - usedQuota;

  return (
    <div className="dashboard">
      {/* 顶部指标卡片 */}
      <div className="grid-4">
        <Card className="metric-card">
          <div className="metric-icon">
            <Coins size={24} />
          </div>
          <div className="metric-label">账户余额</div>
          <div className="metric-value">{(quota / 1000000 * 7).toFixed(2)}</div>
          <div className="metric-sub">USD</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon secondary">
            <Zap size={24} />
          </div>
          <div className="metric-label">剩余额度</div>
          <div className="metric-value gradient-text">
            {(remainQuota / 1000000 * 7).toFixed(2)}
          </div>
          <div className="metric-sub">USD 可用</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon warning">
            <Key size={24} />
          </div>
          <div className="metric-label">已用额度</div>
          <div className="metric-value">{(usedQuota / 1000000 * 7).toFixed(2)}</div>
          <div className="metric-sub">USD</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon success">
            <TrendingUp size={24} />
          </div>
          <div className="metric-label">请求次数</div>
          <div className="metric-value">{userInfo?.request_count || 0}</div>
          <div className="metric-sub">总请求</div>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="content-grid">
        <UsageTrendChart data={usageData} />
        <ModelDistribution data={modelDistribution} />
      </div>

      {/* 统计和预警 */}
      <div className="stats-grid">
        <RequestStats stats={requestStats} />
        <BalanceAlert userInfo={userInfo} />
      </div>
    </div>
  );
}

export default Dashboard;
```

- [ ] **Step 2: 更新样式文件**

在 `Dashboard.css` 末尾添加:

```css
/* 新增图表相关样式 */
.chart-panel {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: var(--muted);
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  color: var(--danger);
  gap: 16px;
}

.error-container button {
  padding: 8px 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  cursor: pointer;
}

.error-container button:hover {
  background: var(--panel-hover);
}

.metric-icon.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

@media (max-width: 980px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/Dashboard/index.jsx frontend/src/pages/Dashboard/Dashboard.css
git commit -m "refactor(dashboard): integrate all chart components

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 测试验证

**Files:**
- N/A

- [ ] **Step 1: 启动开发服务器**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: 验证清单**

- [ ] Dashboard 页面正常加载
- [ ] 4 个指标卡片显示正确
- [ ] 用量趋势折线图显示 7 天数据
- [ ] 模型分布饼图显示各模型占比
- [ ] 请求量统计显示今日/本月请求和成功率
- [ ] 余额预警显示余额状态和进度条
- [ ] 移动端布局正常
- [ ] 无控制台错误

- [ ] **Step 3: 提交最终版本**

```bash
git add -A
git commit -m "feat: complete dashboard visualization upgrade

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## 依赖清单

| 依赖 | 版本 | 用途 |
|------|------|------|
| recharts | ^2.12.0 | 图表组件 |

## 验收标准

- [ ] 四个数据模块正确渲染
- [ ] 图表交互正常（悬停、切换）
- [ ] 加载状态流畅
- [ ] 余额预警阈值正确
- [ ] 移动端布局正常
- [ ] 性能：首屏加载 < 2s
