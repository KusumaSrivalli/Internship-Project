import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBoardStore from '../../store/boardStore';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CreateBoardModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', color: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const { createBoard } = useBoardStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const board = await createBoard(form);
      onClose();
      navigate(`/board/${board.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="font-display font-bold text-text-primary text-lg">Create board</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="mx-6 mt-4 h-20 rounded-xl flex items-end p-4" style={{ background: `linear-gradient(135deg, ${form.color}30, ${form.color}10)`, borderColor: form.color + '40', border: '1px solid' }}>
          <span className="font-display font-bold text-white/80">{form.title || 'Board name'}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Board name *</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="e.g. Product Roadmap"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="input"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    boxShadow: form.color === color ? `0 0 0 2px #18181f, 0 0 0 4px ${color}` : 'none',
                    transform: form.color === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Creating...' : 'Create board'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}