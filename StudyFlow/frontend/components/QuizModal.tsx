'use client';

import { useState } from 'react';
import { reviewQuiz } from '../lib/api';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { 
    mcqs: Array<{ question: string; options: string[]; answer: string }>;
    short_answers: Array<{ question: string; standard_answer: string }>;
  } | null;
  context: string;
  onComplete?: () => void;
}

export default function QuizModal({ isOpen, onClose, data, context, onComplete }: QuizModalProps) {
  const [activeTab, setActiveTab] = useState<'mcq' | 'sa'>('mcq');
  
  // MCQ State
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  
  // Short Answer State
  const [saAnswers, setSaAnswers] = useState<string[]>(['', '', '']);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [saReviews, setSaReviews] = useState<string[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');

  if (!isOpen || !data) return null;

  const handleMcqSelect = (idx: number, option: string) => {
    if (isSubmitted) return;
    setMcqAnswers(prev => ({ ...prev, [idx]: option }));
  };

  const calculateMcqScore = () => {
    let score = 0;
    data?.mcqs.forEach((q, idx) => {
      if (mcqAnswers[idx] === q.answer) {
        score++;
      }
    });
    return score;
  };

  const handleSubmitAll = async () => {
    if (!data) return;
    
    // Validate all answers
    if (Object.keys(mcqAnswers).length < 10) {
        alert("请完成所有选择题！");
        setActiveTab('mcq');
        return;
    }
    if (saAnswers.some(ans => !ans.trim())) {
        alert("请完成所有简答题！");
        setActiveTab('sa');
        return;
    }

    setIsSubmitting(true);
    const mcqScore = calculateMcqScore();

    try {
      const resData = await reviewQuiz({
        questions: data.short_answers.map(sa => sa.question),
        user_answers: saAnswers,
        standard_answers: data.short_answers.map(sa => sa.standard_answer),
        mcq_score: mcqScore,
        context: context
      });
      
      setFinalScore(resData.total_score);
      setSaReviews(resData.short_answer_reviews);
      setOverallFeedback(resData.overall_feedback);
      setIsSubmitted(true);
      
      // Auto check-in if score >= 80
      if (resData.total_score >= 80 && onComplete) {
          setTimeout(() => {
              alert(`🎉 恭喜！最终得分 ${resData.total_score} 分（>=80），已自动为您打卡！`);
              onComplete();
          }, 500);
      }
      
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('交卷失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (confirm('确定完成测验并打卡吗？')) {
        if (onComplete) {
            onComplete();
        }
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">🤖 AI 模拟面试</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('mcq')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                        activeTab === 'mcq' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    选择题 (10)
                </button>
                <button
                    onClick={() => setActiveTab('sa')}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                        activeTab === 'sa' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    简答题 (3)
                </button>
            </div>
            {isSubmitted && finalScore !== null && (
                <div className={`ml-4 px-4 py-1 rounded-full font-bold ${finalScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    最终得分: {finalScore} / 100
                </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {isSubmitted && overallFeedback && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">💡 总体评价</h3>
                    <p className="text-blue-900 text-sm whitespace-pre-wrap">{overallFeedback}</p>
                </div>
            )}

            {activeTab === 'mcq' && (
                <div className="space-y-6">
                    {data.mcqs.map((q, idx) => {
                        const isCorrect = mcqAnswers[idx] === q.answer;
                        const isSelected = !!mcqAnswers[idx];
                        
                        return (
                            <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="font-medium text-gray-900 mb-4 flex">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    {q.question}
                                </h3>
                                <div className="space-y-2 pl-9">
                                    {q.options.map((opt, optIdx) => {
                                        let optClass = "border-gray-200 hover:bg-gray-50";
                                        if (isSubmitted) {
                                            if (opt === q.answer) optClass = "bg-green-50 border-green-300 text-green-700";
                                            else if (mcqAnswers[idx] === opt) optClass = "bg-red-50 border-red-300 text-red-700";
                                            else optClass = "border-gray-100 opacity-50";
                                        } else if (mcqAnswers[idx] === opt) {
                                            optClass = "bg-blue-50 border-blue-300 text-blue-700";
                                        }

                                        return (
                                            <div 
                                                key={optIdx}
                                                onClick={() => handleMcqSelect(idx, opt)}
                                                className={`p-3 border rounded-md cursor-pointer text-sm transition-colors ${optClass}`}
                                            >
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'sa' && (
                <div className="space-y-8">
                    {data.short_answers.map((q, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="font-medium text-gray-900 mb-4 flex">
                                <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                {q.question}
                            </h3>
                            
                            <textarea
                                value={saAnswers[idx]}
                                onChange={(e) => {
                                    const newAns = [...saAnswers];
                                    newAns[idx] = e.target.value;
                                    setSaAnswers(newAns);
                                }}
                                placeholder="请输入你的回答..."
                                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] mb-3"
                                disabled={isSubmitted}
                            />

                            {isSubmitted && saReviews[idx] && (
                                <div className="bg-gray-50 p-4 rounded-md text-sm border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-2">💡 AI 点评与答案：</h4>
                                    <div className="whitespace-pre-wrap text-gray-600 leading-relaxed mb-4">
                                        {saReviews[idx]}
                                    </div>
                                    <div className="bg-white p-3 border border-green-200 rounded text-green-800">
                                        <strong>标准参考：</strong> {q.standard_answer}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                {isSubmitted ? '关闭' : '暂存离开'}
            </button>
            {!isSubmitted && (
                <button 
                    onClick={handleSubmitAll}
                    disabled={isSubmitting}
                    className={`px-6 py-2 text-white rounded-lg shadow-sm font-medium flex items-center ${
                        isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isSubmitting ? 'AI 批改中...' : '交卷并获取评分'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
