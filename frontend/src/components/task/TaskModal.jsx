import { useState, useEffect } from 'react';
import { tasksApi, usersApi } from '../../api/services';
import useBoardStore from '../../store/boardStore';
import Avatar from '../shared/Avatar';
import { format } from 'date-fns';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TaskModal({ task: initialTask, board, onClose }) {
  const task = useBoardStore((s) => {
    for (const list of s.currentBoard?.lists || []) {
      const found = list.tasks?.find((t) => t.id === initialTask.id);
      if (found) return found;
    }
    return initialTask;
  });

  const { updateTask, deleteTask } = useBoardStore();
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const currentList = board.lists.find((l) => l.id === task.list_id);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = async (field, value) => {
    setSaving(true);
    try {
      await updateTask(task.id, { [field]: value });
      setEditing((e) => ({ ...e, [field]: false }));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(task.id, task.list_id);
    onClose();
  };

  const searchUsers = async (q) => {
    setUserSearch(q);
    if (q.length < 2) return setSearchResults([]);
    const { users } = await usersApi.search(q);
    setSearchResults(users.filter((u) => !task.assignees?.some((a) => a.id === u.id)));
  };

  const handleAssign = async (userId) => {
    await tasksApi.assign(task.id, userId);
    setUserSearch(''); setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[calc(100vh-80px)] flex flex-col">
        <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex-1 mr-4">
            {editing.title ? (
              <input autoFocus defaultValue={task.title} className="input text-lg font-bold"
                onBlur={(e) => handleSave('title', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing({ ...editing, title: false }); }} />
            ) : (
              <h2 className="font-display text-xl font-bold text-text-primary cursor-pointer hover:text-accent transition-colors" onClick={() => setEditing({ ...editing, title: true })}>
                {task.title}
              </h2>
            )}
            <p className="text-text-muted text-xs mt-1">in <span className="text-text-secondary">{currentList?.title}</span>{task.created_at && ` · Created ${format(new Date(task.created_at), 'MMM d, yyyy')}`}</p>
          </div>
          <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex gap-1 px-6 flex-shrink-0 border-b border-border">
          {['details', 'assignees'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description</label>
                {editing.description ? (
                  <textarea autoFocus defaultValue={task.description || ''} className="input resize-none text-sm" rows={4}
                    placeholder="Add a description..." onBlur={(e) => handleSave('description', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditing({ ...editing, description: false }); }} />
                ) : (
                  <p className={`text-sm cursor-pointer px-3 py-2 rounded-lg border border-transparent hover:border-border hover:bg-surface-2 transition-all min-h-[60px] ${task.description ? 'text-text-primary' : 'text-text-muted italic'}`}
                    onClick={() => setEditing({ ...editing, description: true })}>
                    {task.description || 'Click to add description...'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Priority</label>
                  <select value={task.priority} onChange={(e) => handleSave('priority', e.target.value)} className="input text-sm capitalize">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Due Date</label>
                  <input type="date" value={task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''} onChange={(e) => handleSave('dueDate', e.target.value || null)} className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Move to List</label>
                <select value={task.list_id} onChange={(e) => handleSave('listId', e.target.value)} className="input text-sm">
                  {board.lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
            </div>
          )}
          {activeTab === 'assignees' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-2 block">Assigned to</label>
                {task.assignees && task.assignees.length > 0 ? (
                  <div className="space-y-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-2">
                        <div className="flex items-center gap-2"><Avatar user={assignee} size="sm" /><span className="text-sm text-text-primary">{assignee.username}</span></div>
                        <button onClick={() => tasksApi.unassign(task.id, assignee.id)} className="btn-danger py-1 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-text-muted text-sm">No one assigned yet</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Search to add</label>
                <input type="text" value={userSearch} onChange={(e) => searchUsers(e.target.value)} className="input text-sm" placeholder="Search username or email..." />
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-surface-2 border border-border rounded-lg overflow-hidden">
                    {searchResults.map((u) => (
                      <button key={u.id} onClick={() => handleAssign(u.id)} className="w-full flex items-center gap-2 p-2.5 hover:bg-surface-3 transition-colors text-left">
                        <Avatar user={u} size="sm" /><span className="text-sm text-text-primary">{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-2 block">Board members</label>
                {board.members?.filter((m) => !task.assignees?.some((a) => a.id === m.id)).map((member) => (
                  <button key={member.id} onClick={() => handleAssign(member.id)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-surface-2 transition-colors text-left">
                    <Avatar user={member} size="sm" /><span className="text-sm text-text-primary">{member.username}</span><span className="ml-auto text-xs text-accent">+ Assign</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <button onClick={handleDelete} className="btn-danger text-xs">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round"/></svg>
            Delete task
          </button>
          {saving && <span className="text-text-muted text-xs animate-pulse">Saving...</span>}
        </div>
      </div>
    </div>
  );
}