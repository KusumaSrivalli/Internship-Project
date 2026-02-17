import { useState } from 'react';
import useBoardStore from '../../store/boardStore';

export default function AddListForm({ boardId }) {
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createList } = useBoardStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createList({ title: title.trim(), boardId });
      setTitle('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 w-72 h-12 flex items-center gap-2 px-4 rounded-xl border-2 border-dashed border-border
                   text-text-muted hover:text-text-primary hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 text-sm"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
        </svg>
        Add list
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 bg-surface-1 rounded-xl border border-border p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input text-sm"
          placeholder="List name..."
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-xs py-1.5" disabled={loading}>
            {loading ? 'Adding...' : 'Add list'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-xs py-1.5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}