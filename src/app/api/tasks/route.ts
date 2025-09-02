// app/api/tasks/route.ts
import { NextResponse } from 'next/server';

type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
  completeTill?: string | null;
};

// SIMPLE IN-MEMORY STORE (replace with DB for real persistence)
const g = globalThis as any;
g.TASKS ||= new Map<string, Task>();
const TASKS: Map<string, Task> = g.TASKS;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = (searchParams.get('filter') ?? 'active') as 'all' | 'active' | 'completed';
  const search = (searchParams.get('search') ?? '').toLowerCase();

  const data = Array.from(TASKS.values()).filter((t) => {
    const filterOk =
      filter === 'all' ? true : filter === 'active' ? !t.done : t.done;
    const searchOk =
      !search ||
      t.title.toLowerCase().includes(search) ||
      (t.description ?? '').toLowerCase().includes(search);
    return filterOk && searchOk;
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, description, completeTill } = body as {
    title?: string;
    description?: string;
    completeTill?: string | null;
  };

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const task: Task = {
    id,
    title,
    description,
    done: false,
    createdAt: new Date().toISOString(),
    completeTill: completeTill ?? null,
  };

  TASKS.set(id, task);
  return NextResponse.json({ data: task }, { status: 201 });
}
