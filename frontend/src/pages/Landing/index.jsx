import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import { Terminal, Zap, Shield, Globe, Copy, Check } from 'lucide-react';
import './Landing.css';

const features = [
  {
    icon: Terminal,
    title: 'OpenAI 兼容',
    desc: '完美兼容 OpenAI API 格式，无缝接入现有应用',
  },
  {
    icon: Zap,
    title: '极速响应',
    desc: '边缘节点部署，全球低延迟访问',
  },
  {
    icon: Shield,
    title: '安全可靠',
    desc: 'API Key 隔离存储，按量计费透明',
  },
  {
    icon: Globe,
    title: '多模型支持',
    desc: 'GPT、Claude、Gemini、DeepSeek 一网打尽',
  },
];

const models = [
  { name: 'GPT-4o', provider: 'OpenAI', status: 'online' },
  { name: 'Claude', provider: 'Anthropic', status: 'online' },
  { name: 'Gemini 2.0 Pro', provider: 'Google', status: 'online' },
  { name: 'DeepSeek V3', provider: 'DeepSeek', status: 'online' },
];

const codeSnippet = `curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

function Landing() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">N</span>
          <span className="brand-text">NETWORK<span className="text-primary">_</span>AI</span>
        </Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">登录</Link>
          <Link to="/register">
            <Button className="btn-primary">立即开始</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span className="pulse-dot" />
          <span>系统已就绪</span>
        </div>

        <h1 className="hero-title">
          一站式<br />
          <span className="gradient-text">AI 模型</span> 网关
        </h1>

        <p className="hero-subtitle">
          兼容 OpenAI 格式 · 支持 40+ AI 渠道 · 按量计费透明
        </p>

        {/* 代码展示卡片 */}
        <div className="code-card">
          <div className="code-card-header">
            <div className="code-card-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <span className="code-card-title">API 调用示例</span>
            <button className="code-card-copy" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <pre className="code-card-body"><code>{`curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</code></pre>
        </div>

        <div className="hero-actions">
          <Link to="/register">
            <Button size="large" className="btn-primary">
              <Zap size={18} />
              免费试用
            </Button>
          </Link>
          <a href="#features">
            <Button size="large" className="btn-ghost">
              了解更多
            </Button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">核心特性</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">
                <f.icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Models Section */}
      <section className="models-section">
        <h2 className="section-title">支持的模型</h2>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.name} className="model-card">
              <div className="model-header">
                <span className="model-name">{m.name}</span>
                <span className={`status-badge ${m.status}`}>
                  <span className="status-dot" />
                  在线
                </span>
              </div>
              <span className="model-provider">{m.provider}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <span>NETWORK_AI v1.0.0</span>
          <span> | </span>
          <span>Built with</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
