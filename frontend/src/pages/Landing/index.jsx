import { Link } from 'react-router-dom';
import { Button } from '@douyinfe/semi-ui';
import { Terminal, Zap, Shield, Globe } from 'lucide-react';
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

function Landing() {
  return (
    <div className="landing">
      {/* Animated Grid Background */}
      <div className="bg-grid-overlay" />

      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-brand font-display">
          <span className="brand-icon">N</span>
          <span className="brand-text">NETWORK<span className="text-primary">_</span>AI</span>
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-link">
            <span className="text-dim">→</span> 登录
          </Link>
          <Link to="/register">
            <Button className="btn-primary glow-on-hover">
              立即开始
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span className="pulse-dot" />
          <span>系统已就绪</span>
        </div>

        <h1 className="hero-title font-display">
          <span className="text-dim">{'// '}</span>
          一站式<br />
          <span className="gradient-text text-glow">AI 模型</span> 网关
        </h1>

        <p className="hero-subtitle">
          兼容 OpenAI 格式 · 支持 40+ AI 渠道 · 按量计费透明
        </p>

        <div className="hero-terminal">
          <div className="terminal-header">
            <div className="terminal-dot dot-red" />
            <div className="terminal-dot dot-yellow" />
            <div className="terminal-dot dot-green" />
            <span className="terminal-title">bash</span>
          </div>
          <pre className="terminal-body">
<span className="text-secondary">$</span> curl https://api.example.com/v1/chat/completions \<br />
&nbsp;&nbsp;-H <span className="text-success">"Authorization: Bearer sk-xxxx"</span> \<br />
&nbsp;&nbsp;-d <span className="text-warning">'{"{"}</span><br />
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">"model"</span>: <span className="text-success">"gpt-4o"</span>,<br />
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">"messages"</span>: <span className="text-warning">[{"..."}</span>]<br />
&nbsp;&nbsp;<span className="text-warning">{'}'}</span><br /><br />
<span className="text-dim">{'>>> '}</span><span className="cursor-blink text-primary">_</span>
          </pre>
        </div>

        <div className="hero-actions">
          <Link to="/register">
            <Button size="large" className="btn-primary glow-on-hover">
              <Zap size={18} />
              免费试用
            </Button>
          </Link>
          <a href="#features">
            <Button size="large" className="btn-ghost">
              了解更多 →
            </Button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title font-display">
          <span className="text-dim">{'// '}</span>核心特性
        </h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card neon-border">
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
        <h2 className="section-title font-display">
          <span className="text-dim">{'// '}</span>支持的模型
        </h2>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.name} className="model-card">
              <div className="model-header">
                <span className="model-name font-display">{m.name}</span>
                <span className={`status-badge ${m.status}`}>
                  <span className="status-dot" />
                  {m.status === 'online' ? '在线' : '离线'}
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
          <span className="font-mono text-dim">NETWORK_AI v1.0.0</span>
          <span className="text-dim"> | </span>
          <span className="text-dim">Built with ♥</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
