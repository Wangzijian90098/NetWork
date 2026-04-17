import { useState, useEffect } from 'react';
import { Card } from '@douyinfe/semi-ui';
import { apiService } from '../../services/api';
import { Coins, Zap, Key, TrendingUp } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await apiService.getUserInfo();
      setUserInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  const quota = userInfo?.quota || 0;
  const usedQuota = userInfo?.usedQuota || 0;
  const remainQuota = quota - usedQuota;

  return (
    <div className="dashboard">
      <div className="grid-4">
        <Card className="metric-card">
          <div className="metric-icon">
            <Coins size={24} />
          </div>
          <div className="metric-label">账户余额</div>
          <div className="metric-value">{quota.toLocaleString()}</div>
          <div className="metric-sub">约 ¥{(quota / 1000000 * 7).toFixed(2)}</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon secondary">
            <Zap size={24} />
          </div>
          <div className="metric-label">剩余额度</div>
          <div className="metric-value gradient-text">
            {remainQuota.toLocaleString()}
          </div>
          <div className="metric-sub">可用额度</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon">
            <Key size={24} />
          </div>
          <div className="metric-label">API Keys</div>
          <div className="metric-value">{userInfo?.tokenCount || 0}</div>
          <div className="metric-sub">活跃密钥</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon success">
            <TrendingUp size={24} />
          </div>
          <div className="metric-label">本月用量</div>
          <div className="metric-value">{usedQuota.toLocaleString()}</div>
          <div className="metric-sub">Token 消耗</div>
        </Card>
      </div>

      <div className="content-grid">
        <Card className="panel">
          <h2>快速开始</h2>
          <div className="quick-start">
            <p>使用以下端点接入 AI 模型：</p>
            <pre className="code-block">
{`curl https://api.network.ai/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4o", "messages": [...]}'`}
            </pre>
          </div>
        </Card>

        <Card className="panel">
          <h2>可用模型</h2>
          <ul className="model-list">
            <li><span className="tag">GPT-4o</span> OpenAI</li>
            <li><span className="tag">Claude 3.5</span> Anthropic</li>
            <li><span className="tag">Gemini Pro</span> Google</li>
            <li><span className="tag">DeepSeek V3</span> DeepSeek</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
