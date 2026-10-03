import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, fetchSubjects, fetchUploaderQuestions, uploadPastQuestion, updatePastQuestion } from '../../api';
import type { Exam, Subject, PastQuestion } from '../../api';
import { QuestionEditor } from './QuestionEditor';

export const UploaderDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  


  useEffect(() => {
    Promise.all([fetchExams(), fetchSubjects()]).then(([examsData, subjectsData]) => {
      setExams(examsData);
      setSubjects(subjectsData);
      if (examsData.length > 0) setSelectedExam(examsData[0].id);
      if (subjectsData.length > 0) setSelectedSubject(subjectsData[0].id);

    });
  }, []);

  useEffect(() => {
    if (selectedExam && selectedSubject && selectedYear) {
      fetchUploaderQuestions(selectedExam as number, selectedSubject as number, selectedYear).then(setQuestions);
    }
  }, [selectedExam, selectedSubject, selectedYear]);

  const years = Array.from({ length: new Date().getFullYear() - 1977 + 1 }, (_, i) => 1977 + i).reverse();
  const possibleNumbers = Array.from({ length: 60 }, (_, i) => i + 1);

  const getQuestionStatusColor = (number: number) => {
    const q = questions.find(q => q.number === number);
    if (!q) return 'bg-surface-variant text-on-surface-variant border-outline-variant opacity-70'; // Missing
    if (q.status === 'pending') return 'bg-tertiary-container text-on-tertiary-container border-tertiary'; // Pending (Yellowish in this theme)
    if (q.status === 'approved') return 'bg-secondary-container text-secondary border-secondary'; // Approved (Greenish)
    if (q.status === 'changes_requested') return 'bg-error-container text-error border-error'; // Rejected (Red)
    return '';
  };

  const currentQuestion = questions.find(q => q.number === selectedNumber);

  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

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
    <div className={`bg-surface min-h-screen text-on-surface flex flex-col ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      <TopNav />
      <div className="pt-20 flex-1 flex">
        {/* Left Pane - Explorer */}
        <div style={{ width: `${leftWidth}%` }} className="border-r border-outline-variant p-6 flex flex-col gap-6 overflow-y-auto">
          <h1 className="font-display-sm">Uploader Dashboard</h1>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-label-md text-on-surface-variant">Exam</label>
              <select 
                className="w-full mt-1 bg-surface-container border border-outline-variant rounded-lg p-2"
                value={selectedExam} onChange={e => setSelectedExam(Number(e.target.value))}
              >
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="font-label-md text-on-surface-variant">Subject</label>
              <select 
                className="w-full mt-1 bg-surface-container border border-outline-variant rounded-lg p-2"
                value={selectedSubject} onChange={e => setSelectedSubject(Number(e.target.value))}
              >
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="font-label-md text-on-surface-variant">Year</label>
            <select 
              className="w-full mt-1 bg-surface-container border border-outline-variant rounded-lg p-2 font-title-md"
              value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="mt-4">
            <h3 className="font-title-sm mb-4">Question Numbers</h3>
            <div className="flex flex-wrap gap-2">
              {possibleNumbers.map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedNumber(num)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-title-sm border-2 transition-all hover:scale-105 ${getQuestionStatusColor(num)} ${selectedNumber === num ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div 
          className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary bg-outline-variant/50 transition-colors z-10"
          onMouseDown={() => setIsDragging(true)}
        />

        {/* Right Pane - Details & Form */}
        <div style={{ width: `calc(${100 - leftWidth}% - 4px)` }} className="p-6 overflow-y-auto bg-surface-container-lowest">
          {!selectedNumber ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
              <p className="font-title-md">Select a question number to view or edit</p>
            </div>
          ) : (
            <QuestionEditor 
              exam={selectedExam as number} 
              subject={selectedSubject as number} 
              year={selectedYear} 
              number={selectedNumber} 
              existingQuestion={currentQuestion}
              onSubmit={async (payload) => {
                if (currentQuestion) {
                  await updatePastQuestion(currentQuestion.id, payload);
                } else {
                  await uploadPastQuestion(payload);
                }
                fetchUploaderQuestions(selectedExam as number, selectedSubject as number, selectedYear).then(setQuestions);
                setSelectedNumber(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
