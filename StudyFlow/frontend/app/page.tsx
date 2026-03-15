'use client';

import { useEffect, useState } from 'react';
import { Task } from '../types';
import { getTasks, updateTask } from '../lib/api';
import TaskCard from '../components/TaskCard';
import ChatBot from '../components/ChatBot';
import Link from 'next/link';

import GitHubWidget from '../components/GitHubWidget';
import Heatmap from '../components/Heatmap';
import { getProfile } from '../lib/api';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [coins, setCoins] = useState(0);

  // Load Tasks
  useEffect(() => {
    loadTasks(date);
    getProfile().then(p => setCoins(p.coins)).catch(console.error);
  }, [date]);

  const loadTasks = async (dateStr: string) => {
    setLoadingTasks(true);
    try {
      const data = await getTasks(dateStr);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleUpdateTask = async (id: number, data: { is_completed?: boolean; note?: string }) => {
    try {
      const updatedTask = await updateTask(id, data);
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
      
      // Refresh coins if task completed
      if (data.is_completed) {
         getProfile().then(p => setCoins(p.coins));
      }
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">StudyFlow</h1>
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-sm font-medium text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full hover:bg-yellow-100 transition-colors flex items-center">
                <span className="mr-1">💰</span>
                {coins}
            </Link>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Quick Links / Dashboard */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Knowledge Base Card */}
            <Link href="/knowledge" className="block group">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group-hover:shadow-md group-hover:border-blue-300 transition-all h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">八股文库</h3>
                    <p className="text-gray-500 text-sm">
                        系统化复习技术知识点，支持 Markdown 阅读。
                    </p>
                </div>
            </Link>

            {/* Paper Weekly Card */}
            <Link href="/papers" className="block group">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group-hover:shadow-md group-hover:border-purple-300 transition-all h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 group-hover:text-purple-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">论文周划</h3>
                    <p className="text-gray-500 text-sm">
                        记录本周精读论文，整理核心贡献与笔记。
                    </p>
                </div>
            </Link>
            
            {/* Shop Card */}
            <Link href="/shop" className="block group">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group-hover:shadow-md group-hover:border-yellow-300 transition-all h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 group-hover:text-yellow-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">奖励商店</h3>
                    <p className="text-gray-500 text-sm">
                        兑换自定义奖励，查看成就勋章墙。
                    </p>
                </div>
            </Link>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats / Heatmap */}
            <div className="lg:col-span-2">
                 <Heatmap />
            </div>

            {/* GitHub Widget */}
            <div className="lg:col-span-1">
                <GitHubWidget />
            </div>
        </div>

        {/* Daily Tasks */}
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-blue-600 w-1 h-6 mr-3 rounded-full"></span>
                今日任务
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingTasks ? (
                <div className="col-span-3 text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">加载任务中...</p>
                </div>
            ) : (
                tasks.map(task => (
                <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
                ))
            )}
            </div>
        </div>
      </main>

      {/* Floating Chat Bot (Global) */}
      <ChatBot />
    </div>
  );
}
