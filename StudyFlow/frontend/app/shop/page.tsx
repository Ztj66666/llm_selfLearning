'use client';

import { useState, useEffect } from 'react';
import { getProfile, getAchievements, checkAchievements, getRewards, createReward, redeemReward } from '../../lib/api';
import Link from 'next/link';

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Reward Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(50);
  const [icon, setIcon] = useState('🎁');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = await getProfile();
      setCoins(profile.coins);
      
      // Trigger check first to update status
      await checkAchievements();
      const ach = await getAchievements();
      setAchievements(ach);
      
      const rwd = await getRewards();
      setRewards(rwd);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReward({ name, description, cost, icon });
      setShowForm(false);
      setName(''); setDescription(''); setCost(50); setIcon('🎁');
      loadData();
    } catch (e) {
      alert('创建失败');
    }
  };

  const handleRedeem = async (reward: any) => {
    if (coins < reward.cost) {
      alert('积分不足！');
      return;
    }
    
    if (!confirm(`确定消耗 ${reward.cost} 积分兑换 "${reward.name}" 吗？`)) return;

    try {
      await redeemReward(reward.id);
      alert('兑换成功！');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-500 hover:text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回主页
                </Link>
                <h1 className="text-xl font-bold text-gray-800">奖励商店 & 成就</h1>
            </div>
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full font-bold shadow-sm">
                <span className="mr-2">💰</span>
                {coins} 积分
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Achievements Section */}
        <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🏆</span>
                我的成就
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {achievements.map(ach => (
                    <div 
                        key={ach.id} 
                        className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                            ach.unlocked_at 
                            ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200 shadow-sm' 
                            : 'bg-gray-100 border-gray-200 opacity-60 grayscale'
                        }`}
                    >
                        <div className="text-4xl mb-2">{ach.icon}</div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{ach.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{ach.description}</p>
                        {ach.unlocked_at && (
                            <span className="mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                已解锁
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </section>

        {/* Shop Section */}
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="text-2xl mr-2">🛍️</span>
                    奖励兑换
                </h2>
                <button 
                    onClick={() => setShowForm(true)}
                    className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    + 自定义奖励
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {rewards.map(reward => (
                    <div key={reward.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-6 flex flex-col items-center flex-1">
                            <div className="text-5xl mb-4">{reward.icon}</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.name}</h3>
                            <p className="text-sm text-gray-500 text-center">{reward.description}</p>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
                            <span className="font-bold text-gray-700">{reward.cost} 💰</span>
                            <button 
                                onClick={() => handleRedeem(reward)}
                                disabled={coins < reward.cost}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    coins >= reward.cost
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                兑换
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </main>

      {/* Add Reward Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4">添加自定义奖励</h2>
                <form onSubmit={handleCreateReward} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full border rounded p-2"
                            placeholder="例如：看电影"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border rounded p-2"
                            placeholder="给自己一点小激励"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">所需积分</label>
                            <input 
                                type="number" 
                                value={cost}
                                onChange={e => setCost(parseInt(e.target.value))}
                                required
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">图标 (Emoji)</label>
                            <input 
                                type="text" 
                                value={icon}
                                onChange={e => setIcon(e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            创建
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
