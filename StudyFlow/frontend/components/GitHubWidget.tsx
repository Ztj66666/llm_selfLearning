'use client';

import { useState, useEffect } from 'react';
import { getGitHubCommits, checkDailyGitHub } from '../lib/api';

export default function GitHubWidget() {
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedToday, setCheckedToday] = useState(false);

  useEffect(() => {
    // 1. Fetch commits
    getGitHubCommits()
      .then(setCommits)
      .catch(console.error)
      .finally(() => setLoading(false));

    // 2. Trigger daily check
    checkDailyGitHub()
      .then(res => {
        if (res.committed_today) {
          setCheckedToday(true);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.543 2.341 1.098 2.91.84.092-.654.35-1.098.636-1.351-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          项目追踪
        </h3>
        {checkedToday && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            今日已提交
          </span>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">加载 Commits...</div>
        ) : commits.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">暂无提交记录</div>
        ) : (
          commits.map((commit, idx) => (
            <div key={idx} className="flex flex-col border-b border-gray-100 pb-2 last:border-0 last:pb-0">
              <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block">
                {commit.message}
              </a>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">{commit.author}</span>
                <span className="text-xs text-gray-400">
                  {new Date(commit.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
