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
