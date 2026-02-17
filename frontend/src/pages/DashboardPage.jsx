import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import CreateBoardModal from '../components/board/CreateBoardModal';
import Avatar from '../components/shared/Avatar';

const BOARD_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const { boards, fetchBoards, isLoading } = useBoardStore();
  const { user, logout } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchBoards(); }, []);

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="border-b border-border bg-surface-1 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-display font-bold text-text-primary">TaskFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-sm hidden sm:block">{user?.username}</span>
            <Avatar user={user} size="sm" />
            <button onClick={logout} className="btn-ghost text-xs">Sign out</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Good {getGreeting()}, {user?.username} 👋
            </h1>
            <p className="text-text-secondary mt-1">Here are your boards</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
            </svg>
            New Board
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-text-muted" stroke="currentColor" strokeWidth="1.5" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-text-primary mb-2">No boards yet</h3>
            <p className="text-text-secondary text-sm mb-6">Create your first board to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create a board</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} onClick={() => navigate(`/board/${board.id}`)} />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="h-36 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5
                         flex flex-col items-center justify-center gap-2 text-text-muted hover:text-accent transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-3 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium">New board</span>
            </button>
          </div>
        )}
      </main>

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function BoardCard({ board, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card text-left h-36 p-5 flex flex-col justify-between group hover:border-accent/30 hover:shadow-glow transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: board.color || '#6366f1', boxShadow: `0 0 8px ${board.color || '#6366f1'}60` }}
        />
        <span className="tag bg-surface-3 text-text-muted capitalize">{board.role}</span>
      </div>
      <div>
        <h3 className="font-display font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
          {board.title}
        </h3>
        {board.description && (
          <p className="text-text-muted text-xs mt-1 line-clamp-1">{board.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-text-muted text-xs">{board.list_count || 0} lists</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-text-muted text-xs">{board.task_count || 0} tasks</span>
        </div>
      </div>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}