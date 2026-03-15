'use client';

import { useState, useEffect } from 'react';
import { createPaper, getPapers, updatePaper } from '../../lib/api';
import Link from 'next/link';

export default function PapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'classic'
  const [showForm, setShowForm] = useState(false);
  const [editingPaper, setEditingPaper] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('new');
  const [notes, setNotes] = useState({ contribution: '', architecture: '', results: '' });

  useEffect(() => {
    loadPapers();
  }, [activeTab]);

  const loadPapers = async () => {
    try {
      const data = await getPapers(activeTab);
      setPapers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setType('new');
    setNotes({ contribution: '', architecture: '', results: '' });
    setEditingPaper(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paperData = {
      title,
      url,
      type,
      notes,
      is_read: editingPaper ? editingPaper.is_read : false
    };

    try {
      if (editingPaper) {
        await updatePaper(editingPaper.id, paperData);
      } else {
        await createPaper(paperData);
      }
      resetForm();
      loadPapers(); // Refresh list
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleEdit = (paper: any) => {
    setEditingPaper(paper);
    setTitle(paper.title);
    setUrl(paper.url || '');
    setType(paper.type);
    setNotes(paper.notes || { contribution: '', architecture: '', results: '' });
    setShowForm(true);
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
                <h1 className="text-xl font-bold text-gray-800">论文周划</h1>
            </div>
            <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加论文
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 mb-6 w-fit">
            <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'new' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                本周新论文
            </button>
            <button
                onClick={() => setActiveTab('classic')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'classic' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                经典旧论文
            </button>
        </div>

        {/* Paper List */}
        <div className="grid grid-cols-1 gap-4">
            {papers.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-dashed">
                    暂无论文，点击右上角添加
                </div>
            ) : (
                papers.map(paper => (
                    <div key={paper.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                                        {paper.title}
                                    </a>
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {new Date(paper.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <button onClick={() => handleEdit(paper)} className="text-gray-400 hover:text-blue-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Structured Notes Display */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md text-sm">
                            <div>
                                <strong className="block text-gray-700 mb-1">核心贡献</strong>
                                <p className="text-gray-600">{paper.notes?.contribution || '暂无'}</p>
                            </div>
                            <div>
                                <strong className="block text-gray-700 mb-1">模型架构</strong>
                                <p className="text-gray-600">{paper.notes?.architecture || '暂无'}</p>
                            </div>
                            <div>
                                <strong className="block text-gray-700 mb-1">实验结果</strong>
                                <p className="text-gray-600">{paper.notes?.results || '暂无'}</p>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingPaper ? '编辑论文笔记' : '添加新论文'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">论文标题</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                            <select 
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option value="new">本周新论文</option>
                                <option value="classic">经典旧论文</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">链接 (URL)</label>
                        <input 
                            type="url" 
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-gray-800 mb-3">结构化笔记</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">核心贡献 (Core Contribution)</label>
                                <textarea 
                                    value={notes.contribution}
                                    onChange={e => setNotes({...notes, contribution: e.target.value})}
                                    rows={3}
                                    className="w-full border rounded p-2"
                                    placeholder="这篇论文解决了什么问题？提出了什么新方法？"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">模型架构 (Model Architecture)</label>
                                <textarea 
                                    value={notes.architecture}
                                    onChange={e => setNotes({...notes, architecture: e.target.value})}
                                    rows={3}
                                    className="w-full border rounded p-2"
                                    placeholder="网络结构有什么特点？关键组件是什么？"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">实验结果 (Experimental Results)</label>
                                <textarea 
                                    value={notes.results}
                                    onChange={e => setNotes({...notes, results: e.target.value})}
                                    rows={3}
                                    className="w-full border rounded p-2"
                                    placeholder="在哪些数据集上测试？SOTA 提升了多少？"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
