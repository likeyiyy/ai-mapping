import { AIModel } from './types';

// 可用的AI模型列表
export const AI_MODELS: AIModel[] = [
  {
    id: 'google/gemini-2.5-pro',
    name: 'Google Gemini 2.5 Pro',
    provider: 'Google',
    maxTokens: 128000,
    costPerToken: 0.00000625,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash',
    provider: 'Google',
    maxTokens: 128000,
    costPerToken: 0.00000125,
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Google Gemini 3 Pro Preview',
    provider: 'Google',
    maxTokens: 128000,
    costPerToken: 0.000005,
  },
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    maxTokens: 128000,
    costPerToken: 0.00000014,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    maxTokens: 200000,
    costPerToken: 0.000003,
  },
];

// 思维导图布局配置
export const LAYOUT_CONFIG = {
  nodeWidth: 300,
  nodeHeight: 120,
  horizontalSpacing: 400,
  verticalSpacing: 150,
  tree: {
    levelHeight: 200,
    siblingSpacing: 50,
  },
  radial: {
    minRadius: 200,
    radiusStep: 150,
  },
};

// 本地存储键名
export const STORAGE_KEYS = {
  conversations: 'ai-mapping-conversations',
  settings: 'ai-mapping-settings',
  currentConversation: 'ai-mapping-current',
};

// API配置
export const API_CONFIG = {
  openRouter: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
};