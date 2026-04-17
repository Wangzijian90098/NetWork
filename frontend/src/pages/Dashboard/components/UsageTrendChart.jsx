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
