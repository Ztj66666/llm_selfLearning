'use client';

import { useState, useEffect } from 'react';
import { getTaskHistory } from '@/lib/api';
import { Task } from '@/types';

export default function NotesHistory() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Reading tasks
    getTaskHistory('阅读')
      .then(data => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm">加载历史笔记中...</div>;
  }

  if (tasks.length === 0) {
    return <div className="text-gray-500 text-sm">暂无阅读笔记</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        阅读心得历史
      </h2>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="border-b pb-3 last:border-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {task.date}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
              {task.note || '未填写心得'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
