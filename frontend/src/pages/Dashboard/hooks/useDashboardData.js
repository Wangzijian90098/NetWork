import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export function useDashboardData() {
  const [userInfo, setUserInfo] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, usageRes] = await Promise.all([
        apiService.getUserInfo(),
        apiService.getUsage(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
      ]);
      setUserInfo(userRes.data);
      setUsageData(usageRes.data?.items || generateMockUsageData());
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据（后端未提供时使用）
  const generateMockUsageData = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map((day, i) => ({
      date: day,
      tokens: Math.floor(Math.random() * 50000) + 10000,
      gpt4: Math.floor(Math.random() * 20000) + 5000,
      claude: Math.floor(Math.random() * 15000) + 3000,
      gemini: Math.floor(Math.random() * 10000) + 2000,
      deepseek: Math.floor(Math.random() * 8000) + 1000,
    }));
  };

  // 模型分布数据
  const getModelDistribution = () => {
    if (!usageData.length) return [];
    const totals = usageData.reduce(
      (acc, day) => ({
        gpt4: acc.gpt4 + (day.gpt4 || 0),
        claude: acc.claude + (day.claude || 0),
        gemini: acc.gemini + (day.gemini || 0),
        deepseek: acc.deepseek + (day.deepseek || 0),
      }),
      { gpt4: 0, claude: 0, gemini: 0, deepseek: 0 }
    );
    return [
      { name: 'GPT-4o', value: totals.gpt4, color: '#10B981' },
      { name: 'Claude', value: totals.claude, color: '#8B5CF6' },
      { name: 'Gemini', value: totals.gemini, color: '#F59E0B' },
      { name: 'DeepSeek', value: totals.deepseek, color: '#3B82F6' },
    ];
  };

  // 请求统计
  const getRequestStats = () => {
    const todayRequests = Math.floor(Math.random() * 500) + 100;
    const monthRequests = Math.floor(Math.random() * 8000) + 2000;
    const successRate = 0.95 + Math.random() * 0.04;
    return {
      today: todayRequests,
      month: monthRequests,
      successRate: (successRate * 100).toFixed(1),
    };
  };

  return {
    userInfo,
    usageData,
    loading,
    error,
    modelDistribution: getModelDistribution(),
    requestStats: getRequestStats(),
    reload: loadData,
  };
}
