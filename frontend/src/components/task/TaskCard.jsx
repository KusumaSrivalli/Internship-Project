import Avatar from '../shared/Avatar';
import { format, isPast, isToday } from 'date-fns';

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  low: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
};

export default function TaskCard({ task, onClick }) {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const hasDueDate = task.due_date;
  const dueDate = hasDueDate ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);

  return (
    <div
      onClick={onClick}
      className="bg-surface-2 border border-border rounded-lg p-3 cursor-pointer
                 hover:border-accent/30 hover:shadow-card-hover hover:-translate-y-0.5
                 transition-all duration-150 group animate-fade-in"
    >
      {/* Priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm text-text-primary font-medium leading-snug flex-1 line-clamp-2 group-hover:text-white transition-colors">
          {task.title}
        </h4>
        <span className={`tag flex-shrink-0 ${priority.bg} ${priority.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-text-muted text-xs mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        {/* Due date */}
        {dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-text-muted'}`}>
            {isOverdue ? '⚠ ' : isDueToday ? '📅 ' : ''}
            {format(dueDate, 'MMM d')}
          </span>
        )}
        {!dueDate && <span />}

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((user) => (
              <Avatar key={user.id} user={user} size="xs" className="ring-1 ring-surface-2" />
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-surface-4 ring-1 ring-surface-2 flex items-center justify-center">
                <span className="text-[9px] text-text-muted font-mono">+{task.assignees.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}