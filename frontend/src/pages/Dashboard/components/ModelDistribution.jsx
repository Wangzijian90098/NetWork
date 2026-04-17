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
