import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, createExam, deleteExam, fetchSubjects, createSubject, deleteSubject, fetchAdminUsers, updateUserRoles, fetchAnalyticsSummary, fetchUserAnalyticsDetail } from '../../api';
import type { Exam, Subject, AuthUser, AnalyticsSummary, AnalyticsDetail } from '../../api';
import { Loader2, Trash2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'subjects' | 'users' | 'analytics'>('exams');

  return (
    <div className="bg-surface min-h-screen text-on-surface flex flex-col">
      <TopNav />
      <div className="pt-20 flex-1 flex flex-col items-center">
        <div className="w-full max-w-5xl p-6">
          <h1 className="font-display-sm mb-6">System Administration</h1>
          
          <div className="flex gap-4 border-b border-outline-variant mb-6">
            {(['exams', 'subjects', 'users', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                className={`py-3 px-6 font-title-md border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
            {activeTab === 'exams' && <ExamManager />}
            {activeTab === 'subjects' && <SubjectManager />}
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete all past questions associated with this exam!')) return;
    try {
      await deleteExam(id);
      load();
    } catch (e) {
      alert(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-title-lg">Manage Exams</h2>
      <div className="flex gap-4">
        <input 
          className="flex-1 bg-surface border border-outline-variant rounded-lg p-3"
          placeholder="New Exam Name (e.g. JAMB)"
          value={newName} onChange={e => setNewName(e.target.value)}
        />
        <button 
          onClick={handleCreate} disabled={isSubmitting || !newName.trim()}
          className="bg-primary text-on-primary px-6 rounded-lg font-title-md hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Exam'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {exams.map(ex => (
          <div key={ex.id} className="flex justify-between items-center p-4 bg-surface border border-outline-variant rounded-xl">
            <span className="font-body-lg">{ex.name}</span>
            <button onClick={() => handleDelete(ex.id)} className="text-error p-2 hover:bg-error-container rounded-lg">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubjectManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete all past questions associated with this subject!')) return;
    try {
      await deleteSubject(id);
      load();
    } catch (e) {
      alert(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-title-lg">Manage Subjects</h2>
      <div className="flex gap-4">
        <input 
          className="flex-1 bg-surface border border-outline-variant rounded-lg p-3"
          placeholder="New Subject Name (e.g. BIOLOGY)"
          value={newName} onChange={e => setNewName(e.target.value)}
        />
        <button 
          onClick={handleCreate} disabled={isSubmitting || !newName.trim()}
          className="bg-primary text-on-primary px-6 rounded-lg font-title-md hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Subject'}
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {subjects.map(sub => (
          <div key={sub.id} className="flex justify-between items-center p-4 bg-surface border border-outline-variant rounded-xl">
            <span className="font-body-lg">{sub.name}</span>
            <button onClick={() => handleDelete(sub.id)} className="text-error p-2 hover:bg-error-container rounded-lg">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
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
        className="w-full bg-surface border border-outline-variant rounded-lg p-3"
        placeholder="Search users by name or email..."
        value={search} onChange={e => setSearch(e.target.value)}
      />
      <div className="flex flex-col gap-3 mt-4">
        {users.map(u => (
          <div key={u.id} className="flex justify-between items-center p-4 bg-surface border border-outline-variant rounded-xl">
            <div>
              <div className="font-title-md">{u.first_name} {u.last_name}</div>
              <div className="font-body-sm text-on-surface-variant">{u.email}</div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={u.groups?.includes('Uploader') || false}
                  onChange={() => toggleRole(u.id, 'Uploader', u.groups || [])}
                  className="w-5 h-5 text-primary"
                />
                <span className="font-title-sm">Uploader</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={u.groups?.includes('Validator') || false}
                  onChange={() => toggleRole(u.id, 'Validator', u.groups || [])}
                  className="w-5 h-5 text-primary"
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
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">Start Time</label>
          <input 
            type="datetime-local" 
            className="w-full bg-surface border border-outline-variant rounded-md p-2"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-label-sm mb-1 text-on-surface-variant">End Time</label>
          <input 
            type="datetime-local" 
            className="w-full bg-surface border border-outline-variant rounded-md p-2"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button onClick={loadSummary} className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded hover:bg-surface-container-high transition-colors">
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
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-on-surface-variant">No activity found in this period.</td></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h2 className="font-display-sm">{selectedUser.first_name} {selectedUser.last_name} - Activity Log</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {startDate ? new Date(startDate).toLocaleString() : 'All time'} to {endDate ? new Date(endDate).toLocaleString() : 'Now'}
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded">
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {details.length === 0 ? (
                <p className="text-on-surface-variant text-center">No detailed activity found.</p>
              ) : (
                details.map(log => (
                  <div key={log.id} className="bg-surface-container border border-outline-variant p-4 rounded-lg flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          log.action === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'approved' ? 'bg-green-100 text-green-700' :
                          log.action === 'edited' ? 'bg-orange-100 text-orange-700' :
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
          </div>
        </div>
      )}
    </div>
  );
};
