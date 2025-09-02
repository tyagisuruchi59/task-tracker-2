import { Task } from '@/types';

let tasks: Task[] = [];

export const store = {
  list() {
    return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  create(title: string, description?: string) {
    const t: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() || undefined,
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(t);
    return t;
  },
  find(id: string) {
    return tasks.find((t) => t.id === id);
  },
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    tasks[idx] = { ...tasks[idx], ...patch };
    return tasks[idx];
  },
  delete(id: string) {
    const before = tasks.length;
    tasks = tasks.filter((t) => t.id !== id);
    return tasks.length < before;
  },
};
