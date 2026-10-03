import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, fetchSubjects, fetchValidatorQuestions, validatePastQuestion, updateValidatorQuestion } from '../../api';
import type { Exam, Subject, PastQuestion } from '../../api';
import { Loader2 } from 'lucide-react';
import { QuestionEditor } from './QuestionEditor';
import { QuestionViewer } from './QuestionViewer';

export const ValidatorDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedQuestion, setSelectedQuestion] = useState<PastQuestion | null>(null);
  
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchExams(), fetchSubjects()]).then(([examsData, subjectsData]) => {
      setExams(examsData);
      setSubjects(subjectsData);
      if (examsData.length > 0) setSelectedExam(examsData[0].id);
      if (subjectsData.length > 0) setSelectedSubject(subjectsData[0].id);
    });
  }, []);

  const refreshQueue = () => {
    if (selectedExam && selectedSubject) {
      fetchValidatorQuestions(selectedExam as number, selectedSubject as number).then(data => {
        setQuestions(data);
        if (!data.find(q => q.id === selectedQuestion?.id)) {
          setSelectedQuestion(null);
        }
      });
    }
  };

  useEffect(() => {
    refreshQueue();
  }, [selectedExam, selectedSubject]);

  const handleValidate = async (action: 'approve' | 'request_changes') => {
    if (!selectedQuestion) return;
    if (action === 'request_changes' && !feedback.trim()) {
      alert("Feedback is required to request changes.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await validatePastQuestion(selectedQuestion.id, action, feedback);
      setFeedback('');
      refreshQueue();
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [leftWidth, setLeftWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`bg-surface h-screen overflow-hidden text-on-surface flex flex-col ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      <TopNav />
      <div className="pt-20 flex-1 flex overflow-hidden">
        {/* Left Pane - Queue */}
        <div style={{ width: `${leftWidth}%` }} className="border-r border-outline-variant p-6 flex flex-col gap-6 overflow-y-auto">
          <h1 className="font-display-sm">Validator Queue</h1>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-label-md text-on-surface-variant">Exam Filter</label>
              <select 
                className="w-full mt-1 bg-surface-container border border-outline-variant rounded-lg p-2"
                value={selectedExam} onChange={e => setSelectedExam(Number(e.target.value))}
              >
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label-md text-on-surface-variant">Subject Filter</label>
              <select 
                className="w-full mt-1 bg-surface-container border border-outline-variant rounded-lg p-2"
                value={selectedSubject} onChange={e => setSelectedSubject(Number(e.target.value))}
              >
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto">
            <h3 className="font-title-sm mb-4 text-on-surface-variant">Pending Questions ({questions.length})</h3>
            <div className="flex flex-col gap-3">
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => { setSelectedQuestion(q); setFeedback(''); setIsEditing(false); }}
                  className={`p-4 rounded-xl text-left transition-all border ${selectedQuestion?.id === q.id ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container border-outline-variant hover:border-primary/50'}`}
                >
                  <div className="font-title-md">{q.year} - Question {q.number}</div>
                  <div className="font-body-sm opacity-70 line-clamp-2 mt-1">{q.question_text}</div>
                </button>
              ))}
              {questions.length === 0 && (
                <div className="p-4 text-center text-on-surface-variant">No pending questions in this queue! 🎉</div>
              )}
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div 
          className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary bg-outline-variant/50 transition-colors z-10"
          onMouseDown={() => setIsDragging(true)}
        />

        {/* Right Pane - Validation */}
        <div style={{ width: `calc(${100 - leftWidth}% - 4px)` }} className="p-6 overflow-y-auto bg-surface-container-lowest">
          {!selectedQuestion ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
              <p className="font-title-md">Select a pending question from the queue</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 max-w-3xl mx-auto">
              {!isEditing ? (
                <QuestionViewer 
                  question={selectedQuestion} 
                  onEdit={() => setIsEditing(true)} 
                />
              ) : (
                <QuestionEditor 
                  exam={selectedQuestion.exam} 
                  subject={selectedQuestion.subject} 
                  year={selectedQuestion.year} 
                  number={selectedQuestion.number} 
                  existingQuestion={selectedQuestion}
                  isValidatorMode={true}
                  onCancel={() => setIsEditing(false)}
                  onSubmit={async (payload) => {
                    const updated = await updateValidatorQuestion(selectedQuestion.id, payload);
                    setSelectedQuestion(updated);
                    setIsEditing(false);
                    refreshQueue(); // also update the item in the list
                  }}
                />
              )}

              {!isEditing && (
                <div className="mt-8 border-t border-outline-variant pt-8">
                  <h3 className="font-title-lg mb-4">Validation Actions</h3>
                  
                  <div className="flex flex-col gap-4">
                    <textarea 
                      className="w-full bg-surface border border-outline-variant rounded-xl p-4 min-h-[100px]"
                      placeholder="Feedback (required if requesting changes)"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                    />
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleValidate('approve')}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-secondary text-on-secondary rounded-xl font-title-lg hover:brightness-110 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Approve Question'}
                      </button>
                      
                      <button 
                        onClick={() => handleValidate('request_changes')}
                        disabled={isSubmitting || !feedback.trim()}
                        className="flex-1 py-4 bg-error text-on-error rounded-xl font-title-lg hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Request Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
