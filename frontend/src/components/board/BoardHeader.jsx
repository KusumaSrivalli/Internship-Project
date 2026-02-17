import { useState } from 'react';
import { boardsApi } from '../../api/services';
import useBoardStore from '../../store/boardStore';
import Avatar from '../shared/Avatar';

export default function BoardHeader({ board, onBack, onToggleActivity, showActivity }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await boardsApi.invite(board.id, inviteEmail);
      setInviteMsg('Member added!');
      setInviteEmail('');
      setTimeout(() => setInviteMsg(''), 3000);
    } catch (err) {
      setInviteMsg(err.error || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-1 flex-shrink-0">
      <button onClick={onBack} className="btn-ghost p-2">
        <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: board.color, boxShadow: `0 0 8px ${board.color}60` }} />
        <h1 className="font-display font-bold text-text-primary truncate">{board.title}</h1>
        {board.description && (
          <span className="text-text-muted text-sm hidden md:block truncate">— {board.description}</span>
        )}
      </div>

      {/* Members */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {board.members?.slice(0, 4).map((member) => (
            <Avatar key={member.id} user={member} size="sm" className="ring-2 ring-surface-1" title={member.username} />
          ))}
          {board.members?.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-surface-3 ring-2 ring-surface-1 flex items-center justify-center">
              <span className="text-xs text-text-muted font-mono">+{board.members.length - 4}</span>
            </div>
          )}
        </div>

        {/* Invite button */}
        <div className="relative">
          <button onClick={() => setShowInvite(!showInvite)} className="btn-ghost text-xs py-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" strokeLinecap="round"/>
            </svg>
            Invite
          </button>
          {showInvite && (
            <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-xl p-4 w-72 shadow-2xl z-30 animate-scale-in">
              <p className="text-sm font-medium text-text-primary mb-3">Invite a member</p>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input text-xs flex-1"
                  placeholder="email@example.com"
                  required
                />
                <button type="submit" className="btn-primary text-xs py-1.5 px-3" disabled={inviting}>
                  {inviting ? '...' : 'Add'}
                </button>
              </form>
              {inviteMsg && (
                <p className={`text-xs mt-2 ${inviteMsg.includes('!') ? 'text-green-400' : 'text-red-400'}`}>
                  {inviteMsg}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Activity toggle */}
        <button
          onClick={onToggleActivity}
          className={`btn-ghost text-xs py-1.5 ${showActivity ? 'text-accent bg-accent/10' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round"/>
          </svg>
          Activity
        </button>
      </div>
    </header>
  );
}