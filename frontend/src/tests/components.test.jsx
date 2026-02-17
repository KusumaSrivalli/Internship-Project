import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Avatar from '../components/shared/Avatar';
import TaskCard from '../components/task/TaskCard';

describe('Avatar', () => {
  it('renders initials from username', () => {
    const { container } = render(<Avatar user={{ username: 'alice', avatar_color: '#6366f1' }} />);
    expect(container.textContent).toBe('AL');
  });

  it('renders ? for missing user', () => {
    const { container } = render(<Avatar user={null} />);
    expect(container.textContent).toBe('?');
  });
});

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'A test task description',
    priority: 'high',
    due_date: null,
    assignees: [],
  };

  it('renders task title', () => {
    render(<TaskCard task={mockTask} onClick={() => {}} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('renders priority badge', () => {
    render(<TaskCard task={mockTask} onClick={() => {}} />);
    expect(screen.getByText('high')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Test Task'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows due date when present', () => {
    const taskWithDue = { ...mockTask, due_date: '2026-03-15T00:00:00Z' };
    render(<TaskCard task={taskWithDue} onClick={() => {}} />);
    expect(screen.getByText(/Mar 15/)).toBeTruthy();
  });
});