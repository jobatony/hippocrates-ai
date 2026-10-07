import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, fetchSubjects, fetchUploaderQuestions, uploadPastQuestion, updatePastQuestion, fetchAvailableYears, fetchQuestionList } from '../../api';
import type { Exam, Subject, PastQuestion } from '../../api';
import { QuestionEditor } from './QuestionEditor';
import { QuestionViewer } from './QuestionViewer';

export const UploaderDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'upload' | 'list'>('upload');

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  
  const [listYears, setListYears] = useState<number[]>([]);
  const [selectedListYear, setSelectedListYear] = useState<number | ''>('');
  const [listQuestions, setListQuestions] = useState<PastQuestion[]>([]);
  const [selectedListNumber, setSelectedListNumber] = useState<number | null>(null);

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

  useEffect(() => {
    if (viewMode === 'list' && selectedExam && selectedSubject) {
      fetchAvailableYears(selectedExam as number, selectedSubject as number).then(years => {
        setListYears(years);
        if (years.length > 0 && (!selectedListYear || !years.includes(selectedListYear as number))) {
          setSelectedListYear(years[0]);
        } else if (years.length === 0) {
          setSelectedListYear('');
          setListQuestions([]);
        }
      });
    }
  }, [viewMode, selectedExam, selectedSubject]);

  useEffect(() => {
    if (viewMode === 'list' && selectedExam && selectedSubject && selectedListYear) {
      fetchQuestionList(selectedExam as number, selectedSubject as number, selectedListYear as number).then(setListQuestions);
    }
  }, [viewMode, selectedExam, selectedSubject, selectedListYear]);

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

  const [leftWidth, setLeftWidth] = useState(30);
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
    <div className={`bg-surface h-screen overflow-hidden text-on-surface flex flex-col ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      <TopNav />
      <div className="pt-20 flex-1 flex overflow-hidden">
        {/* Left Pane - Explorer */}
        <div style={{ width: `${leftWidth}%` }} className="border-r border-outline-variant p-6 flex flex-col gap-6 overflow-y-auto">
          <h1 className="font-display-sm">Uploader Dashboard</h1>
          
          <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1">
            <button 
              onClick={() => setViewMode('upload')}
              className={`flex-1 py-2 rounded-md font-title-sm transition-colors ${viewMode === 'upload' ? 'bg-primary text-on-primary shadow' : 'hover:bg-surface-variant'}`}
            >
              Upload Mode
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 rounded-md font-title-sm transition-colors ${viewMode === 'list' ? 'bg-primary text-on-primary shadow' : 'hover:bg-surface-variant'}`}
            >
              Question List
            </button>
          </div>

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
              value={viewMode === 'upload' ? selectedYear : selectedListYear}
              onChange={e => viewMode === 'upload' ? setSelectedYear(Number(e.target.value)) : setSelectedListYear(Number(e.target.value))}
            >
              {viewMode === 'upload' 
                ? years.map(y => <option key={y} value={y}>{y}</option>)
                : listYears.map(y => <option key={y} value={y}>{y}</option>)
              }
            </select>
            {viewMode === 'list' && listYears.length === 0 && (
              <p className="text-sm text-error mt-1">No questions exist yet for this Exam & Subject.</p>
            )}
          </div>

          {viewMode === 'upload' && (
            <div className="mt-4">
              <h3 className="font-title-sm mb-2">Question Numbers</h3>
              
              <div className="flex flex-wrap gap-3 mb-4 font-body-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border bg-surface-variant border-outline-variant opacity-70"></div>
                  <span className="text-on-surface-variant">Missing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border bg-tertiary-container border-tertiary"></div>
                  <span className="text-on-surface-variant">Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border bg-error-container border-error"></div>
                  <span className="text-on-surface-variant">Changes Req.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm border bg-secondary-container border-secondary"></div>
                  <span className="text-on-surface-variant">Approved</span>
                </div>
              </div>

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
          )}

          {viewMode === 'list' && selectedListYear && (
            <div className="mt-4">
              <h3 className="font-title-sm mb-2">Available Questions</h3>
              
              <div className="flex flex-wrap gap-2">
                {listQuestions.map(q => (
                  <button
                    key={q.number}
                    onClick={() => setSelectedListNumber(q.number)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-title-sm border-2 transition-all hover:scale-105 bg-surface-container hover:bg-surface-variant border-outline-variant ${selectedListNumber === q.number ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface border-primary' : ''}`}
                  >
                    {q.number}
                  </button>
                ))}
                {listQuestions.length === 0 && (
                  <p className="text-sm text-on-surface-variant mt-1">Loading...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Resizer */}
        <div 
          className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary bg-outline-variant/50 transition-colors z-10"
          onMouseDown={() => setIsDragging(true)}
        />

        {/* Right Pane - Details & Form */}
        <div style={{ width: `calc(${100 - leftWidth}% - 4px)` }} className="p-6 overflow-y-auto bg-surface-container-lowest">
          {viewMode === 'upload' ? (
            !selectedNumber ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                <p className="font-title-md">Select a question number to view or edit</p>
              </div>
            ) : currentQuestion?.status === 'approved' ? (
              <QuestionViewer question={currentQuestion} />
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
            )
          ) : (
            !selectedListNumber ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                <p className="font-title-md">Select an existing question from the list to view</p>
              </div>
            ) : listQuestions.find(q => q.number === selectedListNumber) ? (
              <QuestionViewer question={listQuestions.find(q => q.number === selectedListNumber)!} />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};
