'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import QuizModal from './QuizModal';
import { generateQuiz } from '@/lib/api';

interface MarkdownViewerProps {
  content: string;
  onMarkAsRead?: () => void;
  isRead?: boolean;
}

export default function MarkdownViewer({ content, onMarkAsRead, isRead }: MarkdownViewerProps) {
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'green' | 'pink'>('yellow');
  
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizData, setQuizData] = useState<{ 
    mcqs: Array<{ question: string; options: string[]; answer: string }>; 
    short_answers: Array<{ question: string; standard_answer: string }>;
  } | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const colorMap = {
    yellow: 'bg-yellow-200',
    green: 'bg-green-200',
    pink: 'bg-pink-200'
  };

  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const data = await generateQuiz(content);
      if (data.mcqs || data.short_answers) {
        setQuizData(data);
        setIsQuizModalOpen(true);
      } else {
        alert('生成题目失败，请重试');
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('AI 服务暂时不可用，请检查后端日志或 API Key 配置');
    } finally {
      setLoadingQuiz(false);
    }
  };

  if (!content && content !== '') {
      return <div className="p-8 text-red-500">Error: No content provided</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-black relative">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50 sticky top-0 z-10 justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">高亮颜色:</span>
          <div className="flex gap-2">
            {(['yellow', 'green', 'pink'] as const).map((color) => (
              <button
                key={color}
                onClick={() => setHighlightColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  highlightColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
                } ${color === 'yellow' ? 'bg-yellow-400' : color === 'green' ? 'bg-green-400' : 'bg-pink-400'}`}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={handleGenerateQuiz}
          disabled={loadingQuiz}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            loadingQuiz 
              ? 'bg-purple-100 text-purple-400 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
          }`}
        >
          {loadingQuiz ? (
            <>
              <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI 思考中...
            </>
          ) : (
            <>
              <span>✨</span> 生成 AI 测评
            </>
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-8 overflow-y-auto">
        <article className="prose max-w-none 
          prose-headings:text-black prose-headings:mb-6 prose-headings:mt-10 prose-headings:font-bold
          prose-p:text-gray-900 prose-p:leading-loose prose-p:mb-8 prose-p:text-lg
          prose-li:text-gray-900 prose-li:my-3 prose-li:leading-relaxed
          prose-strong:text-black prose-strong:font-bold
          prose-a:text-blue-600 hover:prose-a:text-blue-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p className="mb-8 leading-9 text-lg text-gray-800" {...props} />,
              strong: ({node, ...props}) => (
                <strong 
                  className={`font-bold text-black px-1 rounded ${colorMap[highlightColor]} box-decoration-clone`}
                  {...props} 
                />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
        
        {onMarkAsRead && (
          <div className="mt-12 border-t pt-8 pb-12">
            <button
              onClick={onMarkAsRead}
              disabled={isRead}
              className={`px-8 py-3 rounded-full font-medium text-lg transition-all shadow-md ${
                isRead
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {isRead ? '✅ 今日已阅读' : '📖 标记为今日阅读'}
            </button>
          </div>
        )}
      </div>

      <QuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)} 
        data={quizData}
        context={content}
        onComplete={onMarkAsRead}
      />
    </div>
  );
}
