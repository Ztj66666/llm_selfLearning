'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/types';
import { getTasks, updateTask } from '@/lib/api';
import TaskCard from './TaskCard';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTasks(date);
  }, [date]);

  const loadTasks = async (dateStr: string) => {
    setLoading(true);
    try {
      const data = await getTasks(dateStr);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: { is_completed?: boolean; note?: string }) => {
    try {
      const updatedTask = await updateTask(id, data);
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">StudyFlow 学习打卡</h1>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="border rounded p-2 text-gray-600"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
