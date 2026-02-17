import { create } from 'zustand';
import { boardsApi, listsApi, tasksApi } from '../api/services';

const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,

  setBoards: (boards) => set({ boards }),

  fetchBoards: async () => {
    set({ isLoading: true });
    try {
      const { boards } = await boardsApi.getAll();
      set({ boards, isLoading: false });
    } catch (err) {
      set({ error: err.error, isLoading: false });
    }
  },

  fetchBoard: async (id) => {
    set({ isLoading: true, currentBoard: null });
    try {
      const { board } = await boardsApi.get(id);
      set({ currentBoard: board, isLoading: false });
    } catch (err) {
      set({ error: err.error, isLoading: false });
    }
  },

  createBoard: async (data) => {
    const { board } = await boardsApi.create(data);
    set((s) => ({ boards: [board, ...s.boards] }));
    return board;
  },

  deleteBoard: async (id) => {
    await boardsApi.delete(id);
    set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }));
  },

  // List operations
  createList: async (data) => {
    const { list } = await listsApi.create(data);
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, lists: [...s.currentBoard.lists, list] }
        : null,
    }));
    return list;
  },

  updateList: async (id, data) => {
    const { list } = await listsApi.update(id, data);
    set((s) => ({
      currentBoard: s.currentBoard
        ? {
            ...s.currentBoard,
            lists: s.currentBoard.lists.map((l) =>
              l.id === id ? { ...l, ...list } : l
            ),
          }
        : null,
    }));
  },

  deleteList: async (id) => {
    await listsApi.delete(id);
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, lists: s.currentBoard.lists.filter((l) => l.id !== id) }
        : null,
    }));
  },

  // Task operations
  createTask: async (data) => {
    const { task } = await tasksApi.create(data);
    set((s) => ({
      currentBoard: s.currentBoard
        ? {
            ...s.currentBoard,
            lists: s.currentBoard.lists.map((l) =>
              l.id === task.list_id ? { ...l, tasks: [...l.tasks, task] } : l
            ),
          }
        : null,
    }));
    return task;
  },

  updateTask: async (id, data) => {
    const { task } = await tasksApi.update(id, data);
    get()._replaceTask(task);
    return task;
  },

  deleteTask: async (taskId, listId) => {
    await tasksApi.delete(taskId);
    set((s) => ({
      currentBoard: s.currentBoard
        ? {
            ...s.currentBoard,
            lists: s.currentBoard.lists.map((l) =>
              l.id === listId ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) } : l
            ),
          }
        : null,
    }));
  },

  moveTask: async (taskId, sourceListId, targetListId, newPosition) => {
    // Optimistic update
    const board = get().currentBoard;
    if (!board) return;

    const sourceList = board.lists.find((l) => l.id === sourceListId);
    const task = sourceList?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newLists = board.lists.map((l) => {
      if (l.id === sourceListId) {
        return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
      }
      if (l.id === targetListId) {
        const newTasks = [...l.tasks];
        newTasks.splice(newPosition, 0, { ...task, list_id: targetListId });
        return { ...l, tasks: newTasks };
      }
      return l;
    });

    set((s) => ({ currentBoard: s.currentBoard ? { ...s.currentBoard, lists: newLists } : null }));

    try {
      await tasksApi.move(taskId, { targetListId, newPosition, boardId: board.id });
    } catch {
      // Rollback on error
      get().fetchBoard(board.id);
    }
  },

  // Socket event handlers
  onTaskCreated: (task) => {
    set((s) => {
      if (!s.currentBoard) return s;
      const exists = s.currentBoard.lists.some((l) => l.tasks?.some((t) => t.id === task.id));
      if (exists) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          lists: s.currentBoard.lists.map((l) =>
            l.id === task.list_id ? { ...l, tasks: [...(l.tasks || []), task] } : l
          ),
        },
      };
    });
  },

  onTaskUpdated: (task) => get()._replaceTask(task),

  onTaskDeleted: ({ taskId }) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? {
            ...s.currentBoard,
            lists: s.currentBoard.lists.map((l) => ({
              ...l,
              tasks: l.tasks.filter((t) => t.id !== taskId),
            })),
          }
        : null,
    }));
  },

  onTaskMoved: ({ taskId, sourceListId, targetListId, newPosition, task }) => {
    set((s) => {
      if (!s.currentBoard) return s;
      const newLists = s.currentBoard.lists.map((l) => {
        if (l.id === sourceListId) return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
        if (l.id === targetListId) {
          const filtered = l.tasks.filter((t) => t.id !== taskId);
          filtered.splice(newPosition, 0, task);
          return { ...l, tasks: filtered };
        }
        return l;
      });
      return { currentBoard: { ...s.currentBoard, lists: newLists } };
    });
  },

  onListCreated: (list) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, lists: [...s.currentBoard.lists, list] }
        : null,
    }));
  },

  onListUpdated: (list) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, lists: s.currentBoard.lists.map((l) => l.id === list.id ? { ...l, ...list } : l) }
        : null,
    }));
  },

  onListDeleted: ({ listId }) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, lists: s.currentBoard.lists.filter((l) => l.id !== listId) }
        : null,
    }));
  },

  onMemberAdded: (user) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? { ...s.currentBoard, members: [...(s.currentBoard.members || []), user] }
        : null,
    }));
  },

  // Internal helper
  _replaceTask: (task) => {
    set((s) => ({
      currentBoard: s.currentBoard
        ? {
            ...s.currentBoard,
            lists: s.currentBoard.lists.map((l) => ({
              ...l,
              tasks: l.tasks.map((t) => (t.id === task.id ? task : t)),
            })),
          }
        : null,
    }));
  },
}));

export default useBoardStore;