import { Card } from '@douyinfe/semi-ui';
import { Coins, Zap, Key, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from './hooks/useDashboardData';
import UsageTrendChart from './components/UsageTrendChart';
import ModelDistribution from './components/ModelDistribution';
import RequestStats from './components/RequestStats';
import BalanceAlert from './components/BalanceAlert';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const {
    loading,
    error,
    usageData,
    modelDistribution,
    requestStats,
    usageStats,
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

  const quota = usageStats?.quota || 0;
  const usedQuota = usageStats?.used_quota || 0;
  const remainQuota = quota - usedQuota;

  return (
    <div className="dashboard">
      {user && (
        <div className="welcome-header">
          <h1>欢迎回来, {user.email}</h1>
        </div>
      )}

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
          <div className="metric-value">{usageStats?.request_count || 0}</div>
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
        <BalanceAlert userInfo={usageStats} />
      </div>
    </div>
  );
}

export default Dashboard;
