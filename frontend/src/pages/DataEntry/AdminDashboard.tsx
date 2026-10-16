import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, createExam, deleteExam, fetchSubjects, createSubject, deleteSubject, fetchAdminUsers, updateUserRoles, fetchAdminQuestions, deleteAdminQuestion, bulkDeleteAdminQuestions, fetchAnalyticsSummary, fetchUserAnalyticsDetail } from '../../api';
import type { Exam, Subject, AuthUser, PastQuestion, AnalyticsSummary, AnalyticsDetail } from '../../api';
import { Loader2, Trash2, Eye } from 'lucide-react';
import { QuestionViewer } from './QuestionViewer';
import { AppModal } from '../../components/AppModal';
import { ConfirmModal } from '../../components/ConfirmModal';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'subjects' | 'questions' | 'users' | 'analytics'>('exams');

  return (
    <div className="bg-surface min-h-screen text-on-surface flex flex-col">
      <TopNav />
      <div className="pt-20 flex-1 flex flex-col items-center">
        <div className="w-full max-w-5xl p-4 sm:p-6">
          <h1 className="font-display-sm mb-4 sm:mb-6">System Administration</h1>
          
          <div className="flex gap-2 sm:gap-4 border-b border-outline-variant mb-6 overflow-x-auto no-scrollbar">
            {(['exams', 'subjects', 'questions', 'users', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                className={`py-2.5 sm:py-3 px-4 sm:px-6 font-title-md border-b-2 whitespace-nowrap transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
            {activeTab === 'exams' && <ExamManager />}
            {activeTab === 'subjects' && <SubjectManager />}
            {activeTab === 'questions' && <QuestionManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'analytics' && <AnalyticsManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamManager = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => fetchExams().then(setExams);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createExam(newName);
      setNewName('');
      load();
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExam(examToDelete.id);
      setExamToDelete(null);
      load();
    } catch (e) {
      alert(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-title-lg">Manage Exams</h2>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input 
          className="flex-1 min-w-0 bg-surface border border-outline-variant rounded-lg p-3 text-body-md focus:outline-none focus:border-primary transition-colors"
          placeholder="New Exam Name (e.g. JAMB)"
          value={newName} onChange={e => setNewName(e.target.value)}
        />
        <button 
          onClick={handleCreate} disabled={isSubmitting || !newName.trim()}
          className="w-full sm:w-auto shrink-0 bg-primary text-on-primary px-6 py-3 rounded-lg font-title-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center min-h-[48px]"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Exam'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {exams.map(ex => (
          <div key={ex.id} className="flex justify-between items-center p-3 sm:p-4 bg-surface border border-outline-variant rounded-xl gap-2">
            <span className="font-body-lg truncate">{ex.name}</span>
            <button onClick={() => setExamToDelete(ex)} className="text-error p-2 hover:bg-error-container rounded-lg shrink-0" title="Delete Exam">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Exam?"
        message={`Are you sure? This will delete all past questions associated with the exam "${examToDelete?.name}"!`}
        confirmText="Delete"
      />
    </div>
  );
};

const SubjectManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => fetchSubjects().then(setSubjects);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      await createSubject(newName);
      setNewName('');
      load();
    } catch (e) {
      alert(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubject(subjectToDelete.id);
      setSubjectToDelete(null);
      load();
    } catch (e) {
      alert(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-title-lg">Manage Subjects</h2>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input 
          className="flex-1 min-w-0 bg-surface border border-outline-variant rounded-lg p-3 text-body-md focus:outline-none focus:border-primary transition-colors"
          placeholder="New Subject Name (e.g. BIOLOGY)"
          value={newName} onChange={e => setNewName(e.target.value)}
        />
        <button 
          onClick={handleCreate} disabled={isSubmitting || !newName.trim()}
          className="w-full sm:w-auto shrink-0 bg-primary text-on-primary px-6 py-3 rounded-lg font-title-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center min-h-[48px]"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Subject'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {subjects.map(sub => (
          <div key={sub.id} className="flex justify-between items-center p-3 sm:p-4 bg-surface border border-outline-variant rounded-xl gap-2">
            <span className="font-body-lg truncate">{sub.name}</span>
            <button onClick={() => setSubjectToDelete(sub)} className="text-error p-2 hover:bg-error-container rounded-lg shrink-0" title="Delete Subject">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Subject?"
        message={`Are you sure? This will delete all past questions associated with the subject "${subjectToDelete?.name}"!`}
        confirmText="Delete"
      />
    </div>
  );
};

const UserManager = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  
  const load = (q: string) => fetchAdminUsers(q).then(setUsers);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load(search);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const toggleRole = async (userId: string, role: string, currentRoles: string[]) => {
    const hasRole = currentRoles.includes(role);
    const newRoles = hasRole ? currentRoles.filter(r => r !== role) : [...currentRoles, role];
    
    try {
      const updatedUser = await updateUserRoles(userId, newRoles);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (e) {
      alert(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-title-lg">Manage Roles</h2>
      <input 
        className="w-full min-w-0 bg-surface border border-outline-variant rounded-lg p-3 focus:outline-none focus:border-primary transition-colors"
        placeholder="Search users by name or email..."
        value={search} onChange={e => setSearch(e.target.value)}
      />
      <div className="flex flex-col gap-3 mt-4">
        {users.map(u => (
          <div 
            key={u.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-surface border border-outline-variant rounded-xl gap-3 sm:gap-4 overflow-hidden"
          >
            <div className="min-w-0 flex-1">
              <div className="font-title-md truncate">{u.first_name ? `${u.first_name} ${u.last_name}` : 'Unnamed User'}</div>
              <div className="font-body-sm text-on-surface-variant truncate">{u.email}</div>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={u.groups?.includes('Uploader') || false}
                  onChange={() => toggleRole(u.id, 'Uploader', u.groups || [])}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary rounded focus:ring-primary"
                />
                <span className="font-title-sm">Uploader</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={u.groups?.includes('Validator') || false}
                  onChange={() => toggleRole(u.id, 'Validator', u.groups || [])}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary rounded focus:ring-primary"
                />
                <span className="font-title-sm">Validator</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestionManager: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedUploader, setSelectedUploader] = useState<string>('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<PastQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<PastQuestion | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const years = Array.from({ length: new Date().getFullYear() - 1977 + 1 }, (_, i) => 1977 + i).reverse();

  useEffect(() => {
    Promise.all([fetchExams(), fetchSubjects(), fetchAdminUsers('')])
      .then(([examsData, subjectsData, usersData]) => {
        setExams(examsData);
        setSubjects(subjectsData);
        setUsers(usersData);
      })
      .catch(console.error);
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminQuestions({
        exam: selectedExam || undefined,
        subject: selectedSubject || undefined,
        year: selectedYear || undefined,
        status: selectedStatus || undefined,
        uploaded_by: selectedUploader || undefined,
      });
      setQuestions(data);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedExam, selectedSubject, selectedYear, selectedStatus, selectedUploader]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length && questions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminQuestion(questionToDelete.id);
      if (previewQuestion?.id === questionToDelete.id) setPreviewQuestion(null);
      setQuestionToDelete(null);
      await loadQuestions();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await bulkDeleteAdminQuestions(selectedIds);
      if (previewQuestion && selectedIds.includes(previewQuestion.id)) {
        setPreviewQuestion(null);
      }
      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      await loadQuestions();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: PastQuestion['status']) => {
    if (status === 'approved') {
      return <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">Approved</span>;
    }
    if (status === 'changes_requested') {
      return <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Changes Requested</span>;
    }
    return <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-title-lg">Manage Uploaded Questions</h2>
        {selectedIds.length > 0 && (
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-error text-on-error px-4 py-2.5 rounded-lg font-title-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Exam</label>
          <select
            aria-label="Filter by Exam"
            className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm"
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
          >
            <option value="">All Exams</option>
            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Subject</label>
          <select
            aria-label="Filter by Subject"
            className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Year</label>
          <select
            aria-label="Filter by Year"
            className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Status</label>
          <select
            aria-label="Filter by Status"
            className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>

        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Uploader</label>
          <select
            aria-label="Filter by Uploader"
            className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-body-sm"
            value={selectedUploader}
            onChange={e => setSelectedUploader(e.target.value)}
          >
            <option value="">All Uploaders</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.first_name ? `${u.first_name} ${u.last_name} (${u.email})` : u.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-outline-variant/60">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedIds.length === questions.length && questions.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <span className="font-title-sm text-on-surface">
              Select All ({questions.length})
            </span>
          </label>
          <span className="text-body-sm text-on-surface-variant">
            {selectedIds.length} selected
          </span>
        </div>
      )}

      {/* Question List */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : questions.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant">
          No questions found matching the selected filters.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map(q => (
            <div
              key={q.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-surface border rounded-xl gap-3 transition-colors ${
                selectedIds.includes(q.id) ? 'border-primary bg-primary-container/10' : 'border-outline-variant'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  aria-label={`Select ${q.exam_name} ${q.year} ${q.subject_name} Q${q.number}`}
                  checked={selectedIds.includes(q.id)}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-title-md text-on-surface">
                      {q.exam_name} {q.year} {q.subject_name} - Q{q.number}
                    </span>
                    {getStatusBadge(q.status)}
                    {(q.uploaded_by_name || q.uploaded_by_email) && (
                      <span className="text-label-sm text-on-surface-variant">
                        by {q.uploaded_by_name || q.uploaded_by_email}
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 break-words">
                    {q.question_text}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30 shrink-0">
                <button
                  onClick={() => setPreviewQuestion(q)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-variant text-on-surface font-title-sm flex items-center gap-1.5 transition-colors"
                  title="Preview Question"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setQuestionToDelete(q)}
                  disabled={isDeleting}
                  className="p-2 text-error hover:bg-error-container rounded-lg transition-colors"
                  title="Delete Question"
                  aria-label={`Delete ${q.exam_name} ${q.year} ${q.subject_name} Q${q.number}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AppModal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        title="Question Preview"
        maxWidth="3xl"
        centerOnMobile
        closeButtonAriaLabel="Close Preview"
      >
        {previewQuestion && (
          <div className="flex flex-col gap-4">
            <QuestionViewer
              question={previewQuestion}
              onDelete={() => setQuestionToDelete(previewQuestion)}
            />
          </div>
        )}
      </AppModal>

      {/* Delete Question Confirmation Modal */}
      <ConfirmModal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        isLoading={isDeleting}
        title="Delete Question?"
        message={`Are you sure you want to delete ${questionToDelete?.exam_name} ${questionToDelete?.year} ${questionToDelete?.subject_name} - Question ${questionToDelete?.number}? This action cannot be undone.`}
        confirmText="Delete"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        isLoading={isDeleting}
        title="Delete Questions?"
        message={`Are you sure you want to delete ${selectedIds.length} selected question(s)? This action cannot be undone.`}
        confirmText={`Delete (${selectedIds.length})`}
      />
    </div>
  );
};

const AnalyticsManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<AnalyticsSummary | null>(null);
  const [details, setDetails] = useState<AnalyticsDetail[]>([]);

  useEffect(() => {
    loadSummary();
  }, [startDate, endDate]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // Use iso strings or leave empty
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data = await fetchAnalyticsSummary(start, end);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user: AnalyticsSummary) => {
    setSelectedUser(user);
    try {
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data = await fetchUserAnalyticsDetail(user.id, start, end);
      setDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-label-sm mb-1 text-on-surface-variant">Start Time</label>
          <input 
            type="datetime-local" 
            className="w-full bg-surface border border-outline-variant rounded-md p-2"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-label-sm mb-1 text-on-surface-variant">End Time</label>
          <input 
            type="datetime-local" 
            className="w-full bg-surface border border-outline-variant rounded-md p-2"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button onClick={loadSummary} className="w-full sm:w-auto bg-surface-variant text-on-surface-variant px-4 py-2 rounded hover:bg-surface-container-high transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="p-3 font-title-sm text-on-surface-variant">User</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Roles</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Uploaded</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Approved</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Changes Req.</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Edited</th>
                <th className="p-3 font-title-sm text-on-surface-variant">Deleted</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-on-surface-variant">No activity found in this period.</td></tr>
              )}
              {summary.map(user => (
                <tr key={user.id} className="border-b border-outline-variant hover:bg-surface-container-high cursor-pointer transition-colors" onClick={() => handleUserClick(user)}>
                  <td className="p-3">
                    <div className="font-title-sm">{user.first_name} {user.last_name}</div>
                    <div className="text-body-sm text-on-surface-variant">{user.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(r => <span key={r} className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full">{r}</span>)}
                    </div>
                  </td>
                  <td className="p-3 text-body-lg font-bold">{user.total_uploaded}</td>
                  <td className="p-3 text-body-lg font-bold text-green-600">{user.total_approved}</td>
                  <td className="p-3 text-body-lg font-bold text-red-500">{user.total_changes_requested}</td>
                  <td className="p-3 text-body-lg font-bold text-orange-500">{user.total_edited}</td>
                  <td className="p-3 text-body-lg font-bold text-rose-600">{user.total_deleted ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name} - Activity Log` : ''}
        maxWidth="2xl"
        centerOnMobile
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface-variant -mt-2 mb-4">
              {startDate ? new Date(startDate).toLocaleString() : 'All time'} to {endDate ? new Date(endDate).toLocaleString() : 'Now'}
            </p>
            {details.length === 0 ? (
              <p className="text-on-surface-variant text-center py-6">No detailed activity found.</p>
            ) : (
              details.map(log => (
                <div key={log.id} className="bg-surface-container border border-outline-variant p-4 rounded-lg flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        log.action === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                        log.action === 'approved' ? 'bg-green-100 text-green-700' :
                        log.action === 'edited' ? 'bg-orange-100 text-orange-700' :
                        log.action === 'deleted' ? 'bg-rose-100 text-rose-800' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="font-title-sm">{log.question_info}</p>
                    {log.notes && <p className="text-body-sm text-on-surface-variant mt-2 border-l-2 border-outline-variant pl-2 italic">"{log.notes}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </AppModal>
    </div>
  );
};

