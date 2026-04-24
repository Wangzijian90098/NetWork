import { useState, useEffect } from 'react';
import { Card, Button, Input, Toast, Modal } from '@douyinfe/semi-ui';
import { Plus, Copy, Trash2, Eye, EyeOff, Key, Clock } from 'lucide-react';
import { apiService } from '../../services/api';
import './APIKeys.css';

function APIKeys() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data } = await apiService.getKeys();
      // 兼容后端返回格式
      const keys = data.data || data.items || [];
      setTokens(keys);
    } catch (err) {
      console.error(err);
      Toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      Toast.error('请输入 Key 名称');
      return;
    }
    setCreating(true);
    try {
      const { data } = await apiService.createKey(newKeyName);
      const newKey = data.data || data;
      setTokens([newKey, ...tokens]);
      setNewKeyName('');
      // 显示新创建的 Key
      setNewlyCreatedKey(newKey);
    } catch (err) {
      console.error(err);
      Toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个 API Key 吗？此操作无法撤销。',
      onOk: async () => {
        try {
          await apiService.deleteKey(id);
          setTokens(tokens.filter((t) => t.id !== id));
          Toast.success('删除成功');
        } catch (err) {
          Toast.error('删除失败');
        }
      },
    });
  };

  const handleCopy = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    Toast.success('已复制到剪贴板');
  };

  const handleReveal = async (token) => {
    const tokenId = token.id;
    if (revealedKeys[tokenId]) {
      const newRevealed = { ...revealedKeys };
      delete newRevealed[tokenId];
      setRevealedKeys(newRevealed);
      return;
    }
    try {
      const { data } = await apiService.getKey(tokenId);
      setRevealedKeys({ ...revealedKeys, [tokenId]: data.key || data.data?.key });
    } catch (err) {
      Toast.error('获取 Key 失败');
    }
  };

  const getDisplayKey = (token) => {
    if (revealedKeys[token.id]) {
      return revealedKeys[token.id];
    }
    // 尝试从多个可能的字段获取
    const masked = token.api_key || token.unmasked_key || token.key || '';
    return masked ? `${masked.slice(0, 8)}...${masked.slice(-4)}` : 'sk-***...****';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="api-keys">
      <Card className="create-card">
        <h2>创建新的 API Key</h2>
        <p className="create-hint">API Key 将用于认证您的请求，请妥善保管</p>
        <div className="create-form">
          <Input
            placeholder="Key 名称（如：开发环境）"
            value={newKeyName}
            onChange={(val) => setNewKeyName(val)}
            onEnterPress={handleCreate}
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
            <Key size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>还没有 API Key，点击上方按钮创建一个</p>
          </Card>
        ) : (
          tokens.map((token) => (
            <Card key={token.id} className="key-card">
              <div className="key-info">
                <div className="key-header">
                  <h3>{token.name}</h3>
                  <span className={`key-status ${token.is_active !== false ? 'active' : 'inactive'}`}>
                    {token.is_active !== false ? '启用' : '禁用'}
                  </span>
                </div>
                <code className="key-value">
                  {getDisplayKey(token)}
                </code>
                <div className="key-meta">
                  <span><Clock size={12} /> {formatDate(token.created_at || token.createdAt)}</span>
                </div>
              </div>
              <div className="key-actions">
                <Button
                  size="small"
                  theme="borderless"
                  icon={revealedKeys[token.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  onClick={() => handleReveal(token)}
                />
                <Button
                  size="small"
                  theme="borderless"
                  icon={<Copy size={16} />}
                  onClick={() => handleCopy(revealedKeys[token.id] || token.api_key || token.key)}
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

      {/* 新建 Key 成功弹窗 */}
      <Modal
        visible={!!newlyCreatedKey}
        onCancel={() => setNewlyCreatedKey(null)}
        footer={null}
        title="API Key 创建成功"
        size="small"
      >
        <div className="new-key-modal">
          <p className="warning-text">请立即复制并保存您的 API Key，此密钥将不再显示。</p>
          <div className="new-key-display">
            <code>{newlyCreatedKey?.api_key || newlyCreatedKey?.key || '-'}</code>
          </div>
          <Button
            className="btn-primary"
            icon={<Copy size={16} />}
            onClick={() => {
              handleCopy(newlyCreatedKey?.api_key || newlyCreatedKey?.key);
              setNewlyCreatedKey(null);
            }}
            block
          >
            复制并关闭
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default APIKeys;
