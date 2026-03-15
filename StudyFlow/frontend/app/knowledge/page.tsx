'use client';

import { useEffect, useState } from 'react';
import KnowledgeSidebar from '@/components/KnowledgeSidebar';
import MarkdownViewer from '@/components/MarkdownViewer';
import ChatBot from '@/components/ChatBot';
import { getKnowledgeList, getKnowledgeContent, updateTask, getTasks } from '@/lib/api';
import { Task } from '@/types';
import Link from 'next/link';
import NotesHistory from '@/components/NotesHistory';

export default function KnowledgePage() {
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);
  
  // Need tasks to find today's reading task
  const [tasks, setTasks] = useState<Task[]>([]);
  const date = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getKnowledgeList().then(setKnowledgeFiles).catch(console.error);
    getTasks(date).then(setTasks).catch(console.error);
  }, [date]);

  useEffect(() => {
    if (selectedFile) {
      setLoadingMarkdown(true);
      getKnowledgeContent(selectedFile)
        .then(data => setMarkdownContent(data.content))
        .catch(console.error)
        .finally(() => setLoadingMarkdown(false));
    }
  }, [selectedFile]);

  const handleMarkAsRead = async () => {
    const readingTask = tasks.find(t => t.task_type === '八股文阅读');
    if (readingTask && selectedFile) {
      const newNote = readingTask.note 
        ? `${readingTask.note}, ${selectedFile.replace('.md', '')}`
        : selectedFile.replace('.md', '');
      
      await updateTask(readingTask.id, {
        is_completed: true,
        note: newNote
      });
      alert('已标记为今日阅读，并更新了任务状态！');
      
      // Refresh tasks
      getTasks(date).then(setTasks);
    } else {
      alert('未找到今日的“八股文阅读”任务，请检查日期是否为今天。');
    }
  };

  const isReadingTaskCompleted = tasks.find(t => t.task_type === '八股文阅读')?.is_completed;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <KnowledgeSidebar 
          files={knowledgeFiles} 
          selectedFile={selectedFile} 
          onSelect={(file) => {
            setSelectedFile(file);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }} 
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <div className="bg-white border-b p-4 shadow-sm flex-shrink-0 z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <Link href="/" className="text-gray-500 hover:text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回主页
                </Link>
                <h1 className="text-xl font-bold text-gray-800">八股文库</h1>
            </div>
        </div>

        {/* Content Split: Viewer vs History */}
        <div className="flex-1 flex overflow-hidden">
            {/* Viewer (Left/Center) */}
            <div className="flex-1 overflow-auto bg-white p-6 relative border-r">
            {selectedFile ? (
                loadingMarkdown ? (
                <div className="text-center py-20 text-gray-500">加载文档中...</div>
                ) : (
                <MarkdownViewer 
                    content={markdownContent} 
                    onMarkAsRead={handleMarkAsRead}
                    isRead={isReadingTaskCompleted}
                />
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-lg">请从左侧选择一篇八股文开始阅读</p>
                </div>
            )}
            </div>
            
            {/* History (Right, Collapsible or fixed width) */}
            <div className="w-80 bg-gray-50 border-l hidden md:block">
                <NotesHistory />
            </div>
        </div>
      </main>

      <ChatBot 
        context={markdownContent} 
        title={selectedFile ? selectedFile.replace('.md', '') : undefined} 
      />
    </div>
  );
}
