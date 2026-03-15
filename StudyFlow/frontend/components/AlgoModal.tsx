'use client';

import { useState, useEffect } from 'react';
import { generateAlgoProblems, submitAlgoProblem } from '../lib/api';

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  completed: boolean;
  user_code: string;
  feedback: string;
}

interface AlgoModalProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
}

export default function AlgoModal({ taskId, isOpen, onClose, onTaskUpdate }: AlgoModalProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load problems when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProblems();
    }
  }, [isOpen]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await generateAlgoProblems(taskId);
      // New format: { problems: [], recommendation_text: "" }
      // Old format: []
      let loadedProblems = [];
      if (Array.isArray(data)) {
        loadedProblems = data;
      } else {
        loadedProblems = data.problems;
      }
      setProblems(loadedProblems);
    } catch (error) {
      console.error('Failed to load algorithm problems', error);
      alert('加载题目失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (code: string) => {
    const newProblems = [...problems];
    newProblems[activeTab] = {
      ...newProblems[activeTab],
      user_code: code
    };
    setProblems(newProblems);
  };

  const handleSubmit = async () => {
    const currentProblem = problems[activeTab];
    if (!currentProblem) return;

    setSubmitting(true);
    
    try {
      const result = await submitAlgoProblem(taskId, activeTab, currentProblem.user_code);
      
      // Update local problems state with new result
      const newProblems = [...problems];
      newProblems[activeTab] = {
        ...newProblems[activeTab],
        completed: result.status === 'PASS',
        feedback: result.feedback
      };
      setProblems(newProblems);

      if (result.all_completed) {
        onTaskUpdate(); // Notify parent to refresh task list
        setTimeout(() => {
            alert('恭喜！今日算法任务已完成！');
            onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Submission failed', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentProblem = problems[activeTab];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">每日算法挑战</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">正在生成题目...</span>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Problem List & Description */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
              {/* Tabs */}
              <div className="flex border-b bg-white">
                {problems.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === idx
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    题目 {idx + 1}
                    {p.completed && (
                      <span className="ml-1 text-green-500">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="flex-1 p-4 overflow-y-auto">
                {currentProblem && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currentProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        currentProblem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentProblem.difficulty}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{currentProblem.title}</h3>
                    </div>
                    <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">
                      <p>{currentProblem.description}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Code Editor & Feedback */}
            <div className="w-2/3 flex flex-col bg-white">
              <div className="flex-1 p-4 flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-2">Python Solution:</label>
                <textarea
                  value={currentProblem?.user_code || ''}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-sm border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-800"
                  placeholder="def solution(): ..."
                  spellCheck={false}
                />
              </div>

              {/* Feedback Section */}
              <div className="h-1/3 border-t p-4 bg-gray-50 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-700">执行结果</h4>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !currentProblem}
                    className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                      submitting 
                        ? 'bg-blue-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? '判题中...' : '提交运行'}
                  </button>
                </div>
                
                {currentProblem?.feedback && (
                  <div className={`p-3 rounded border ${
                    currentProblem.completed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center font-bold mb-1">
                      {currentProblem.completed ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          通过
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          未通过
                        </>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{currentProblem.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
