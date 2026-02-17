import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import { joinBoard, leaveBoard } from '../hooks/useSocket';
import TaskCard from '../components/task/TaskCard';
import TaskModal from '../components/task/TaskModal';
import AddListForm from '../components/board/AddListForm';
import BoardHeader from '../components/board/BoardHeader';
import ActivityPanel from '../components/board/ActivityPanel';
import Spinner from '../components/shared/Spinner';

export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentBoard, fetchBoard, isLoading, moveTask, deleteList } = useBoardStore();
  const user = useAuthStore((s) => s.user);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [editingListId, setEditingListId] = useState(null);

  useEffect(() => {
    fetchBoard(id);
    joinBoard(id);
    return () => leaveBoard(id);
  }, [id]);

  const onDragEnd = (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    moveTask(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Board not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <BoardHeader
        board={currentBoard}
        onBack={() => navigate('/')}
        onToggleActivity={() => setShowActivity(!showActivity)}
        showActivity={showActivity}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {currentBoard.lists.map((list) => (
                <KanbanList
                  key={list.id}
                  list={list}
                  boardId={id}
                  onTaskClick={setSelectedTask}
                  isEditing={editingListId === list.id}
                  onEditStart={() => setEditingListId(list.id)}
                  onEditEnd={() => setEditingListId(null)}
                />
              ))}
              <AddListForm boardId={id} />
            </div>
          </DragDropContext>
        </div>

        {/* Activity panel */}
        {showActivity && (
          <div className="w-80 border-l border-border bg-surface-1 flex-shrink-0">
            <ActivityPanel boardId={id} />
          </div>
        )}
      </div>

      {/* Task modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          board={currentBoard}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

function KanbanList({ list, boardId, onTaskClick, isEditing, onEditStart, onEditEnd }) {
  const { createTask, deleteList, updateList } = useBoardStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [listTitle, setListTitle] = useState(list.title);
  const [adding, setAdding] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAdding(true);
    try {
      await createTask({ title: newTaskTitle.trim(), listId: list.id, boardId });
      setNewTaskTitle('');
      setShowAddTask(false);
    } finally {
      setAdding(false);
    }
  };

  const handleTitleSave = async () => {
    if (listTitle.trim() && listTitle !== list.title) {
      await updateList(list.id, { title: listTitle.trim() });
    }
    onEditEnd();
  };

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-surface-1 rounded-xl border border-border max-h-[calc(100vh-160px)]">
      {/* List header */}
      <div className="flex items-center justify-between p-3 flex-shrink-0">
        {isEditing ? (
          <input
            autoFocus
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') onEditEnd(); }}
            className="input text-sm font-semibold py-1 px-2 flex-1"
          />
        ) : (
          <button onClick={onEditStart} className="font-semibold text-text-primary text-sm hover:text-accent transition-colors flex-1 text-left truncate">
            {list.title}
          </button>
        )}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <span className="tag bg-surface-3 text-text-muted font-mono text-xs">{list.tasks?.length || 0}</span>
          <button
            onClick={() => deleteList(list.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete list"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tasks */}
      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-3 pb-3 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-accent/5' : ''
            }`}
            style={{ minHeight: 60 }}
          >
            {(list.tasks || []).map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-70 rotate-1' : ''}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick(task)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task */}
      <div className="p-3 pt-0 flex-shrink-0">
        {showAddTask ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <textarea
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setShowAddTask(false); setNewTaskTitle(''); } }}
              className="input text-sm resize-none"
              placeholder="Task name..."
              rows={2}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-1.5 text-xs" disabled={adding}>
                {adding ? 'Adding...' : 'Add task'}
              </button>
              <button type="button" onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }} className="btn-ghost py-1.5 text-xs">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full flex items-center gap-2 text-text-muted hover:text-text-primary text-sm py-1.5 px-2 rounded-lg hover:bg-surface-3 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}