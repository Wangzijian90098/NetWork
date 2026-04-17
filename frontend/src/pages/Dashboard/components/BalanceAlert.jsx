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
