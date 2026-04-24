import { Card, Tabs, TabPane, Button } from '@douyinfe/semi-ui';
import { Book, Code, Key, Zap, Copy } from 'lucide-react';
import { Toast } from '@douyinfe/semi-ui';
import './Docs.css';

function Docs() {
  const baseUrl = '/v1';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Toast.success('已复制到剪贴板');
  };

  const CodeBlock = ({ language, children }) => (
    <div className="code-block">
      <div className="code-header">
        <span>{language}</span>
        <Button
          size="small"
          theme="borderless"
          icon={<Copy size={14} />}
          onClick={() => copyToClipboard(children)}
        />
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );

  return (
    <div className="docs">
      <h1>API 文档</h1>

      <Tabs type="line" style={{ width: '100%' }}>
        <TabPane tab="快速开始" itemKey="quickstart">
          <Card className="doc-card">
            <h2><Zap size={20} /> 快速开始</h2>
            <p>使用 NetWork AI API，只需三步即可开始：</p>

            <div className="step-list">
              <div className="step">
                <span className="step-num">1</span>
                <div>
                  <h3>获取 API Key</h3>
                  <p>在 <a href="/app/api-keys">API Keys 页面</a> 创建一个新的 API Key</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <div>
                  <h3>发起请求</h3>
                  <p>使用您的 API Key 向我们的代理端点发送请求</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <div>
                  <h3>接收响应</h3>
                  <p>自动路由到最优模型，返回 AI 生成的内容</p>
                </div>
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="认证" itemKey="auth">
          <Card className="doc-card">
            <h2><Key size={20} /> 认证</h2>
            <p>所有 API 请求都需要在 Header 中包含您的 API Key：</p>

            <CodeBlock language="Header">
{`Authorization: Bearer YOUR_API_KEY`}</CodeBlock>

            <p>示例请求：</p>

            <CodeBlock language="curl">
{`curl https://api.network.ai/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello!"}]}'`}</CodeBlock>
          </Card>
        </TabPane>

        <TabPane tab="聊天接口" itemKey="chat">
          <Card className="doc-card">
            <h2><Code size={20} /> 聊天补全</h2>

            <h3>请求</h3>
            <CodeBlock language="POST">
{`POST ${baseUrl}/chat/completions`}</CodeBlock>

            <CodeBlock language="JSON">
{`{
  "model": "gpt-4",           // 可选: gpt-4, gpt-3.5-turbo, claude-3, gemini-pro
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,         // 可选: 0-2，控制随机性
  "max_tokens": 1000          // 可选，控制回复长度
}`}</CodeBlock>

            <h3>响应</h3>
            <CodeBlock language="JSON">
{`{
  "id": "chatcmpl-xxx",
  "model": "gpt-4",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}`}</CodeBlock>
          </Card>
        </TabPane>

        <TabPane tab="模型列表" itemKey="models">
          <Card className="doc-card">
            <h2><Book size={20} /> 支持的模型</h2>

            <table className="model-table">
              <thead>
                <tr>
                  <th>模型</th>
                  <th>提供商</th>
                  <th>描述</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>gpt-4</code></td>
                  <td>OpenAI</td>
                  <td>最强大的 GPT 模型，适合复杂任务</td>
                </tr>
                <tr>
                  <td><code>gpt-3.5-turbo</code></td>
                  <td>OpenAI</td>
                  <td>快速且经济实惠的选择</td>
                </tr>
                <tr>
                  <td><code>claude-3-opus</code></td>
                  <td>Anthropic</td>
                  <td>Claude 3 系列旗舰模型</td>
                </tr>
                <tr>
                  <td><code>claude-3-sonnet</code></td>
                  <td>Anthropic</td>
                  <td>平衡性能与成本的 Claude 模型</td>
                </tr>
                <tr>
                  <td><code>gemini-pro</code></td>
                  <td>Google</td>
                  <td>Google Gemini 系列模型</td>
                </tr>
                <tr>
                  <td><code>deepseek-chat</code></td>
                  <td>DeepSeek</td>
                  <td>国产高性能模型</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Docs;