'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, GitBranch, MessageSquare, Brain, Zap } from 'lucide-react';
import { AI_MODELS, DEFAULT_AI_MODEL } from '@/lib/constants';

interface ExamplePrompt {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

interface HomePageProps {
  onStartChat: (message: string, model: string) => void;
}

export default function HomePage({ onStartChat }: HomePageProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);

  const examplePrompts: ExamplePrompt[] = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "学习探讨",
      description: "深度学习与神经网络原理",
      prompt: "请详细解释深度学习和神经网络的基本原理，以及它们之间的关系"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "创意思考",
      description: "探索创新思维的多种方式",
      prompt: "如何培养创新思维？有哪些实用的方法和技巧？"
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: "技术对比",
      description: "不同编程语言的优劣分析",
      prompt: "对比分析Python、JavaScript和Go语言的特点及适用场景"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "问题解决",
      description: "复杂问题的拆解与解决",
      prompt: "面对复杂问题时，如何进行有效的拆解和系统性思考？"
    }
  ];

  const handleSend = () => {
    if (input.trim()) {
      onStartChat(input.trim(), selectedModel);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AI 对话思维导图</h1>
          </div>
          <div className="text-sm text-gray-600">
            将 AI 对话可视化为清晰的知识网络
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            探索 AI 对话的
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              无限可能
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            使用思维导图组织你的 AI 对话，创建分支、比较不同模型的观点，
            让复杂的思想变得清晰易懂。
          </p>
        </motion.div>

        {/* Chat Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题或想法，开始创建思维导图..."
              className="w-full resize-none text-base border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 p-3 focus:border-blue-400 focus:outline-none transition-colors"
              rows={4}
            />
            <div className="flex justify-between items-center mt-4">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                开始对话
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            灵感示例
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {examplePrompts.map((example, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(example.prompt)}
                className="bg-white rounded-xl p-5 text-left hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-center gap-2 text-purple-600 mb-3">
                  {example.icon}
                  <span className="font-medium">{example.title}</span>
                </div>
                <p className="text-sm text-gray-600">{example.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">分支对话</h3>
            <p className="text-gray-600 text-sm">在任何节点创建新的对话分支，探索不同的思路</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">多模型对比</h3>
            <p className="text-gray-600 text-sm">用不同AI模型回答同一问题，对比各自的观点</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">知识可视化</h3>
            <p className="text-gray-600 text-sm">将复杂的对话转化为直观的思维导图结构</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>由 OpenRouter 驱动 · 支持 GPT、Claude、Gemini 等多种模型</p>
        </div>
      </footer>
    </div>
  );
}