'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBotProps {
  context?: string;
  title?: string;
}

export default function ChatBot({ context, title }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是你的 AI 学习助手。有什么可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, presetPrompt?: string) => {
    e?.preventDefault();
    const messageToSend = presetPrompt || input;
    if (!messageToSend.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: messageToSend } as Message];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          context: context,
          title: title
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，网络连接似乎出了点问题。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-[90vw] md:w-96 h-[80vh] md:h-[500px] mb-4 flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">AI 学习助手</h3>
              {title && <p className="text-xs opacity-80 truncate max-w-[200px]">正在阅读: {title}</p>}
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none break-words">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-2 border rounded-lg">
                              <table className="min-w-full divide-y divide-gray-200" {...props} />
                            </div>
                          ),
                          th: ({node, ...props}) => (
                            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 border-b last:border-0" {...props} />
                          ),
                          img: ({node, ...props}) => (
                            <img className="max-w-full h-auto rounded-lg shadow-sm my-2" {...props} />
                          ),
                          code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                              <code className={`${className} block bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2 text-xs`} {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-xs" {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Buttons */}
          <div className="p-2 bg-gray-100 border-t border-gray-200 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button 
              onClick={() => handleSubmit(undefined, '通俗易懂地解释这段内容')}
              disabled={isLoading}
              className="px-3 py-1 bg-white text-blue-600 text-xs rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              🧐 解释这段
            </button>
            <button 
              onClick={() => handleSubmit(undefined, '这道题面试常怎么考？')}
              disabled={isLoading}
              className="px-3 py-1 bg-white text-purple-600 text-xs rounded-full border border-purple-200 hover:bg-purple-50 transition-colors"
            >
              💼 面试考点
            </button>
            <button 
              onClick={() => handleSubmit(undefined, '帮我对比一下类似概念')}
              disabled={isLoading}
              className="px-3 py-1 bg-white text-green-600 text-xs rounded-full border border-green-200 hover:bg-green-50 transition-colors"
            >
              ⚖️ 概念对比
            </button>
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => handleSubmit(e)} className="p-4 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className={`p-2 rounded-full ${
                isLoading || !input.trim() 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
