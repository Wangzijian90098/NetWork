import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@douyinfe/semi-ui';
import { Plus, Copy, Trash2, Check } from 'lucide-react';
import { apiService } from '../../services/api';
import './APIKeys.css';

function APIKeys() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data } = await apiService.getTokens();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const { data } = await apiService.createToken(newKeyName);
      setTokens([data, ...tokens]);
      setNewKeyName('');
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个 API Key 吗？')) return;
    try {
      await apiService.deleteToken(id);
      setTokens(tokens.filter((t) => t.id !== id));
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleCopy = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="api-keys">
      <Card className="create-card">
        <h2>创建新的 API Key</h2>
        <div className="create-form">
          <Input
            placeholder="Key 名称（如：开发环境）"
            value={newKeyName}
            onChange={setNewKeyName}
            style={{ flex: 1 }}
          />
          <Button
            className="btn-primary"
            icon={<Plus size={16} />}
            onClick={handleCreate}
            loading={creating}
          >
            创建
          </Button>
        </div>
      </Card>

      <div className="key-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : tokens.length === 0 ? (
          <Card className="empty-card">
            <p>还没有 API Key，点击上方按钮创建一个</p>
          </Card>
        ) : (
          tokens.map((token) => (
            <Card key={token.id} className="key-card">
              <div className="key-info">
                <h3>{token.name}</h3>
                <code className="key-value">
                  {token.key.slice(0, 8)}...{token.key.slice(-4)}
                </code>
              </div>
              <div className="key-actions">
                <Button
                  size="small"
                  theme="borderless"
                  icon={
                    copiedId === token.id ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )
                  }
                  onClick={() => handleCopy(token.key, token.id)}
                />
                <Button
                  size="small"
                  theme="borderless"
                  type="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDelete(token.id)}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default APIKeys;
