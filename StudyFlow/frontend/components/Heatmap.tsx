'use client';

import { useEffect, useState } from 'react';
import { getHeatmapStats } from '@/lib/api';

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeatmapStats()
      .then(res => {
        const map: Record<string, number> = {};
        res.forEach((item: any) => {
          map[item.date] = item.count;
        });
        setData(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Generate last 60 days
  const days = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const getColor = (count: number) => {
    if (!count) return 'bg-gray-100';
    if (count === 1) return 'bg-green-200';
    if (count === 2) return 'bg-green-300';
    if (count === 3) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        学习热力图 (近60天)
      </h3>
      
      {loading ? (
        <div className="h-20 flex items-center justify-center text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
          {days.map(date => {
            const count = data[date] || 0;
            return (
              <div 
                key={date}
                className={`w-3 h-3 rounded-sm ${getColor(count)}`}
                title={`${date}: ${count} 个任务`}
              />
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 justify-end">
        <span>Less</span>
        <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
        <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
        <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
        <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
        <span>More</span>
      </div>
    </div>
  );
}
