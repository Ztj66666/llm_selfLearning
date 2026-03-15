'use client';

import { Task } from '@/types';
import { useState, useEffect } from 'react';
import AlgoModal from './AlgoModal';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: number, data: { is_completed?: boolean; note?: string }) => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [note, setNote] = useState(task.note || '');
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [problemLinks, setProblemLinks] = useState<any[]>([]);

  // Sync local state with props when they change
  useEffect(() => {
    setNote(task.note || '');
    
    // Parse task data for recommendation and links if available
    if (task.task_type.includes('算法') && task.data) {
        try {
            const data = JSON.parse(task.data);
            // Handle new format
            if (data.recommendation_text) {
                setRecommendation(data.recommendation_text);
            }
            if (data.problems) {
                setProblemLinks(data.problems);
            } else if (Array.isArray(data)) {
                // Old format
                setProblemLinks(data);
            }
        } catch (e) {
            console.error("Failed to parse task data", e);
        }
    }
  }, [task.note, task.data, task.task_type]);

  const isAlgoTask = task.task_type.includes('算法');

  const handleToggle = () => {
    if (isAlgoTask && !task.is_completed) {
        setIsAlgoModalOpen(true);
        return;
    }
    
    // For manual toggle (if allowed or for other tasks)
    onUpdate(task.id, { is_completed: !task.is_completed });
  };

  const handleNoteBlur = () => {
    if (note !== task.note) {
      onUpdate(task.id, { note });
    }
  };

  return (
    <>
      <div className={`p-4 border rounded-lg shadow-sm transition-colors ${task.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{task.task_type}</h3>
          <button
            onClick={handleToggle}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
              task.is_completed 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {task.is_completed ? '完成' : (isAlgoTask ? '开始刷题' : '打卡')}
          </button>
        </div>
        
        {!isAlgoTask && (
            <div className="mt-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
                心得 / 笔记
            </label>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteBlur}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-800"
                rows={3}
                placeholder="记录今日学习心得..."
            />
            </div>
        )}
        
        {isAlgoTask && (
             <div className="mt-2">
                {recommendation && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-sm text-blue-800 italic">
                            AI 推荐语: "{recommendation}"
                        </p>
                    </div>
                )}
                
                {problemLinks.length > 0 && (
                    <div className="space-y-1 mb-3">
                        {problemLinks.map((p: any, idx: number) => (
                            <a 
                                key={idx} 
                                href={p.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-xs text-gray-600 hover:text-blue-600 hover:underline flex items-center"
                            >
                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                    p.completed ? 'bg-green-500' : 
                                    p.difficulty === 'Easy' ? 'bg-green-300' :
                                    p.difficulty === 'Medium' ? 'bg-yellow-300' : 'bg-red-300'
                                }`}></span>
                                {p.title} <span className="text-gray-400 ml-1">({p.difficulty})</span>
                            </a>
                        ))}
                    </div>
                )}

                <p className="text-sm text-gray-500">
                    {task.is_completed ? '今日三道算法题已完成！' : '点击“开始刷题”由 AI 生成每日三道算法题。'}
                </p>
                {task.is_completed && (
                    <button 
                        onClick={() => setIsAlgoModalOpen(true)}
                        className="mt-2 text-xs text-blue-500 hover:underline"
                    >
                        回顾题目
                    </button>
                )}
             </div>
        )}
      </div>

      {isAlgoTask && (
        <AlgoModal 
            taskId={task.id}
            isOpen={isAlgoModalOpen}
            onClose={() => setIsAlgoModalOpen(false)}
            onTaskUpdate={() => {
                // This might be redundant if the parent re-fetches, 
                // but ensures local update happens if parent doesn't auto-refresh immediately
                onUpdate(task.id, { is_completed: true });
            }}
        />
      )}
    </>
  );
}
