import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';

export function useDashboardData() {
  const [usageData, setUsageData] = useState([]);
  const [modelDistributionData, setModelDistributionData] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [trendRes, modelRes, statsRes] = await Promise.all([
        apiService.getUsageTrend(7),
        apiService.getModelDistribution(),
        apiService.getUsageStats(),
      ]);
      setUsageData(trendRes.data?.items || generateMockUsageData());
      setModelDistributionData(modelRes.data || []);
      setUsageStats(statsRes.data || getDefaultStats());
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // 默认统计（后端未提供时使用）
  const getDefaultStats = () => {
    const todayRequests = Math.floor(Math.random() * 500) + 100;
    const monthRequests = Math.floor(Math.random() * 8000) + 2000;
    const successRate = 0.95 + Math.random() * 0.04;
    return {
      today: todayRequests,
      month: monthRequests,
      successRate: (successRate * 100).toFixed(1),
    };
  };

  // 请求统计
  const getRequestStats = () => {
    return {
      today: usageStats?.today || getDefaultStats().today,
      month: usageStats?.month || getDefaultStats().month,
      successRate: usageStats?.successRate || getDefaultStats().successRate,
    };
  };

  return {
    usageStats,
    usageData,
    loading,
    error,
    modelDistribution: modelDistributionData,
    requestStats: getRequestStats(),
    reload: loadData,
  };
}
