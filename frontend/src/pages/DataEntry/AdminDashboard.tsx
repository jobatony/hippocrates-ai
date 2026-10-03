import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/TopNav';
import { fetchExams, createExam, deleteExam, fetchSubjects, createSubject, deleteSubject, fetchAdminUsers, updateUserRoles } from '../../api';
import type { Exam, Subject, AuthUser } from '../../api';
import { Loader2, Trash2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'subjects' | 'users'>('exams');

  return (
    <div className="bg-surface min-h-screen text-on-surface flex flex-col">
      <TopNav />
      <div className="pt-20 flex-1 flex flex-col items-center">
        <div className="w-full max-w-5xl p-6">
          <h1 className="font-display-sm mb-6">System Administration</h1>
          
          <div className="flex gap-4 border-b border-outline-variant mb-6">
            {(['exams', 'subjects', 'users'] as const).map(tab => (
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
