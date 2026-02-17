import { useState, useEffect } from 'react';
import { activitiesApi } from '../../api/services';
import Avatar from '../shared/Avatar';
import { formatDistanceToNow } from 'date-fns';

const ACTION_LABELS = {
  task_created: 'created task',
  task_updated: 'updated task',
  task_deleted: 'deleted task',
  task_moved: 'moved task',
  member_added: 'added member',
};

export default function ActivityPanel({ boardId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { activities } = await activitiesApi.getForBoard(boardId, { limit: 30 });
        setActivities(activities);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [boardId]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text-primary text-sm">Activity</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-surface-2 animate-pulse" />)}
          </div>
        )}
        {!loading && activities.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">No activity yet</p>
        )}
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar user={{ username: activity.username, avatar_color: activity.avatar_color }} size="xs" className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary">
                <span className="font-medium">{activity.username}</span>{' '}
                <span className="text-text-secondary">{ACTION_LABELS[activity.action] || activity.action}</span>
                {activity.meta?.title && (
                  <span className="text-text-primary"> "{activity.meta.title}"</span>
                )}
                {activity.meta?.username && (
                  <span className="text-text-primary"> {activity.meta.username}</span>
                )}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}