import { useState, useEffect } from 'react';
import { Card, Button, Input, Toast } from '@douyinfe/semi-ui';
import { Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../../services/api';
import './APIKeys.css';

function APIKeys() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState({});

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data } = await apiService.getTokens();
      setTokens(data.items || []);
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
      Toast.success('API Key 创建成功');
    } catch (err) {
      Toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个 API Key 吗？')) return;
    try {
      await apiService.deleteToken(id);
      setTokens(tokens.filter((t) => t.id !== id));
      Toast.success('删除成功');
    } catch (err) {
      Toast.error('删除失败');
    }
  };

  const handleCopy = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    Toast.success('已复制到剪贴板');
  };

  const handleReveal = async (tokenId) => {
    if (revealedKeys[tokenId]) {
      const newRevealed = { ...revealedKeys };
      delete newRevealed[tokenId];
      setRevealedKeys(newRevealed);
      return;
    }
    try {
      const { data } = await apiService.getTokenKey(tokenId);
      setRevealedKeys({ ...revealedKeys, [tokenId]: data.key });
    } catch (err) {
      Toast.error('获取 Key 失败');
    }
  };

  const getDisplayKey = (token) => {
    if (revealedKeys[token.id]) {
      return revealedKeys[token.id];
    }
    const masked = token.unmasked_key || '';
    return masked ? `${masked.slice(0, 8)}...${masked.slice(-4)}` : 'sk-***...****';
  };

  return (
    <div className="api-keys">
      <Card className="create-card">
        <h2>创建新的 API Key</h2>
        <div className="create-form">
          <Input
            placeholder="Key 名称（如：开发环境）"
            value={newKeyName}
            onChange={(val) => setNewKeyName(val)}
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
                  {getDisplayKey(token)}
                </code>
              </div>
              <div className="key-actions">
                <Button
                  size="small"
                  theme="borderless"
                  icon={revealedKeys[token.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  onClick={() => handleReveal(token.id)}
                />
                <Button
                  size="small"
                  theme="borderless"
                  icon={<Copy size={16} />}
                  onClick={() => handleCopy(revealedKeys[token.id] || token.unmasked_key)}
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
