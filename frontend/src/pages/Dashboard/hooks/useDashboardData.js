import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/api';

const MODEL_COLORS = {
  'gpt-4o': '#10B981',
  'gpt-4o-mini': '#34D399',
  'gpt-4-turbo': '#059669',
  'gpt-3.5-turbo': '#6EE7B7',
  'claude-opus-4-7': '#8B5CF6',
  'claude-sonnet-4-7': '#A78BFA',
  'claude-3-opus': '#7C3AED',
  'deepseek-chat': '#3B82F6',
  'deepseek-coder': '#60A5FA',
  'gemini-1.5-pro': '#F59E0B',
  'gemini-1.5-flash': '#FBBF24',
  'moonshot-v1-8k': '#EC4899',
  'glm-4': '#EF4444',
  'qwen-plus': '#14B8A6',
};

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

      // 转换趋势数据
      const trend = trendRes.data?.success ? trendRes.data.data : [];
      setUsageData(trend.length > 0 ? trend : generateMockUsageData());

      // 转换模型分布数据
      const models = modelRes.data?.success ? modelRes.data.data : [];
      const transformedModels = models.map(item => ({
        name: item.model,
        value: item.tokens,
        percentage: item.percentage,
        color: MODEL_COLORS[item.model] || '#6b7a8d',
      }));
      setModelDistributionData(transformedModels.length > 0 ? transformedModels : getDefaultModelDistribution());

      // 转换统计数据
      const stats = statsRes.data?.success ? statsRes.data.data?.summary : null;
      setUsageStats(stats || getDefaultStats());
    } catch (err) {
      setError(err);
      console.error(err);
      // 使用模拟数据
      setUsageData(generateMockUsageData());
      setModelDistributionData(getDefaultModelDistribution());
      setUsageStats(getDefaultStats());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 模拟趋势数据（后端未提供时使用）
  const generateMockUsageData = () => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map((day, i) => ({
      date: day,
      tokens: Math.floor(Math.random() * 50000) + 10000,
      requests: Math.floor(Math.random() * 200) + 50,
      'gpt-4o': Math.floor(Math.random() * 20000) + 5000,
      'claude-sonnet-4-7': Math.floor(Math.random() * 15000) + 3000,
      'gemini-1.5-flash': Math.floor(Math.random() * 10000) + 2000,
      'deepseek-chat': Math.floor(Math.random() * 8000) + 1000,
    }));
  };

  // 默认模型分布
  const getDefaultModelDistribution = () => [
    { name: 'GPT-4o', value: 45000, percentage: 40, color: '#10B981' },
    { name: 'Claude', value: 28000, percentage: 25, color: '#8B5CF6' },
    { name: 'Gemini', value: 22000, percentage: 20, color: '#F59E0B' },
    { name: 'DeepSeek', value: 15000, percentage: 15, color: '#3B82F6' },
  ];

  // 默认统计
  const getDefaultStats = () => {
    const todayRequests = Math.floor(Math.random() * 500) + 100;
    const monthRequests = Math.floor(Math.random() * 8000) + 2000;
    const successRate = 0.95 + Math.random() * 0.04;
    return {
      totalRequests: monthRequests,
      totalInputTokens: Math.floor(Math.random() * 500000) + 100000,
      totalOutputTokens: Math.floor(Math.random() * 300000) + 50000,
      totalCost: Math.random() * 50,
      quota: 1000000,
      used_quota: Math.floor(Math.random() * 500000),
      today,
      month,
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
