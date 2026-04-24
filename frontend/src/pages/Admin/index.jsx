import { useState } from 'react';
import { Card, Table, Button, Modal, InputNumber, Toast, Tag, Space, Typography } from '@douyinfe/semi-ui';
import { Users, CreditCard, Key, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import './Admin.css';

const { Text } = Typography;

function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [platformKeys, setPlatformKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [addKeyModalVisible, setAddKeyModalVisible] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    platform: 'openai',
    apiKey: '',
    apiSecret: '',
    region: 'GLOBAL',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiService.adminGetUsers();
      setUsers(data.data || []);
    } catch (err) {
      Toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformKeys = async () => {
    setLoading(true);
    try {
      const { data } = await apiService.adminGetPlatformKeys();
      setPlatformKeys(data.data || []);
    } catch (err) {
      Toast.error('加载平台密钥失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!selectedUser || rechargeAmount <= 0) {
      Toast.error('请输入正确的金额');
      return;
    }
    try {
      await apiService.adminRecharge(selectedUser.id, rechargeAmount);
      Toast.success('充值成功');
      setRechargeModalVisible(false);
      loadUsers();
    } catch (err) {
      Toast.error('充值失败');
    }
  };

  const handleDeletePlatformKey = async (keyId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个平台密钥吗？',
      onOk: async () => {
        try {
          await apiService.adminDeletePlatformKey(keyId);
          Toast.success('删除成功');
          loadPlatformKeys();
        } catch (err) {
          Toast.error('删除失败');
        }
      },
    });
  };

  const handleAddPlatformKey = async () => {
    if (!newKeyForm.platform || !newKeyForm.apiKey) {
      Toast.error('请填写必填项');
      return;
    }
    try {
      await apiService.adminAddPlatformKey(newKeyForm);
      Toast.success('添加成功');
      setAddKeyModalVisible(false);
      setNewKeyForm({ platform: 'openai', apiKey: '', apiSecret: '', region: 'GLOBAL' });
      loadPlatformKeys();
    } catch (err) {
      Toast.error('添加失败');
    }
  };

  const handleSyncToWorkers = async () => {
    try {
      await apiService.adminSync();
      Toast.success('同步成功');
    } catch (err) {
      Toast.error('同步失败');
    }
  };

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: (text) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (text) => text || '-',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      render: (val) => <Text type="success">${val?.toFixed(4) || '0.00'}</Text>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'grey'}>
          {enabled ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setRechargeModalVisible(true);
            }}
          >
            充值
          </Button>
        </Space>
      ),
    },
  ];

  const platformKeyColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      render: (text) => <Text strong>{text?.toUpperCase()}</Text>,
    },
    {
      title: '区域',
      dataIndex: 'region',
      render: (text) => <Tag>{text || 'GLOBAL'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'grey'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          size="small"
          type="danger"
          onClick={() => handleDeletePlatformKey(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="admin">
      <h1>管理后台</h1>

      {/* Tab 导航 */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            if (users.length === 0) loadUsers();
          }}
        >
          <Users size={16} /> 用户管理
        </button>
        <button
          className={`tab-btn ${activeTab === 'platform' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('platform');
            if (platformKeys.length === 0) loadPlatformKeys();
          }}
        >
          <Key size={16} /> 平台密钥
        </button>
        <button
          className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={handleSyncToWorkers}
        >
          <RefreshCw size={16} /> 同步到 Workers
        </button>
      </div>

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <Card className="admin-card">
          <div className="card-header">
            <h2>用户列表</h2>
            <Button onClick={loadUsers}>刷新</Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      )}

      {/* 平台密钥 */}
      {activeTab === 'platform' && (
        <Card className="admin-card">
          <div className="card-header">
            <h2>平台密钥</h2>
            <Space>
              <Button onClick={loadPlatformKeys}>刷新</Button>
              <Button
                type="primary"
                onClick={() => setAddKeyModalVisible(true)}
              >
                添加密钥
              </Button>
            </Space>
          </div>
          <Table
            columns={platformKeyColumns}
            dataSource={platformKeys}
            loading={loading}
            pagination={false}
            rowKey="id"
          />
        </Card>
      )}

      {/* 充值弹窗 */}
      <Modal
        title="用户充值"
        visible={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        onOk={handleRecharge}
        okText="确认充值"
      >
        {selectedUser && (
          <div className="recharge-modal">
            <p>为用户 <strong>{selectedUser.email}</strong> 充值</p>
            <p>当前余额: <Text type="success">${selectedUser.balance?.toFixed(4) || '0.00'}</Text></p>
            <div className="form-group">
              <label>充值金额 (USD)</label>
              <InputNumber
                value={rechargeAmount}
                onChange={setRechargeAmount}
                min={0}
                step={10}
                precision={2}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 添加密钥弹窗 */}
      <Modal
        title="添加平台密钥"
        visible={addKeyModalVisible}
        onCancel={() => setAddKeyModalVisible(false)}
        onOk={handleAddPlatformKey}
        okText="添加"
      >
        <div className="recharge-modal">
          <div className="form-group">
            <label>平台</label>
            <select
              value={newKeyForm.platform}
              onChange={(e) => setNewKeyForm({ ...newKeyForm, platform: e.target.value })}
              className="semi-select"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
              <option value="google">Google</option>
              <option value="moonshot">Moonshot</option>
              <option value="zhipu">Zhipu</option>
              <option value="alibaba">Alibaba</option>
            </select>
          </div>
          <div className="form-group">
            <label>API Key *</label>
            <input
              type="password"
              value={newKeyForm.apiKey}
              onChange={(e) => setNewKeyForm({ ...newKeyForm, apiKey: e.target.value })}
              placeholder="sk-..."
              className="semi-input"
            />
          </div>
          <div className="form-group">
            <label>API Secret</label>
            <input
              type="password"
              value={newKeyForm.apiSecret}
              onChange={(e) => setNewKeyForm({ ...newKeyForm, apiSecret: e.target.value })}
              placeholder="可选"
              className="semi-input"
            />
          </div>
          <div className="form-group">
            <label>区域</label>
            <select
              value={newKeyForm.region}
              onChange={(e) => setNewKeyForm({ ...newKeyForm, region: e.target.value })}
              className="semi-select"
            >
              <option value="GLOBAL">GLOBAL</option>
              <option value="CN">CN (中国)</option>
              <option value="US">US (美国)</option>
              <option value="EU">EU (欧洲)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Admin;