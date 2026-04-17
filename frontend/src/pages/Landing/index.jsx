import { Link } from 'react-router-dom';
import ParticleBackground from '../../components/common/ParticleBackground';
import { Button } from '@douyinfe/semi-ui';
import './Landing.css';

const models = [
  { name: 'GPT-4o', provider: 'OpenAI', icon: '🤖' },
  { name: 'Claude 3.5', provider: 'Anthropic', icon: '🧠' },
  { name: 'Gemini Pro', provider: 'Google', icon: '💎' },
  { name: 'DeepSeek V3', provider: 'DeepSeek', icon: '🔥' },
];

function Landing() {
  return (
    <div className="landing">
      <ParticleBackground />

      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="brand-icon">N</span>
          NetWork AI
        </div>
        <div className="nav-links">
          <Link to="/login">
            <Button theme="borderless" style={{ color: '#fff' }}>
              登录
            </Button>
          </Link>
          <Link to="/register">
            <Button className="btn-primary">立即开始</Button>
          </Link>
        </div>
      </nav>

      <section className="hero">
        <h1>
          一站式 <span className="gradient-text">AI 模型</span> 接入平台
        </h1>
        <p>
          兼容 OpenAI 格式，支持 GPT、Claude、Gemini、DeepSeek 等主流模型
        </p>
        <div className="hero-actions">
          <Link to="/register">
            <Button size="large" className="btn-primary">
              免费试用
            </Button>
          </Link>
          <Button
            size="large"
            className="btn-secondary"
            onClick={() =>
              document
                .getElementById('models')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            查看模型
          </Button>
        </div>
      </section>

      <section id="models" className="models-section">
        <h2>支持的模型</h2>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.name} className="model-card">
              <span className="model-icon">{m.icon}</span>
              <h3>{m.name}</h3>
              <p>{m.provider}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Landing;
