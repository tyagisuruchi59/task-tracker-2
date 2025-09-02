// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';

type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
  completeTill?: string | null;
};

const g = globalThis as any;
const TASKS: Map<string, Task> = g.TASKS || new Map<string, Task>();

export async function POST(
  req: Request,
  ctx: { params: { id: string } }
) {
  const id = ctx.params.id;
  const t = TASKS.get(id);
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({} as any));

  if (typeof body.done === 'boolean') {
    t.done = !!body.done;
    TASKS.set(id, t);
    return NextResponse.json({ data: t }, { status: 200 });
  }

  if (body.delete === true) {
    TASKS.delete(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: 'No valid action' }, { status: 400 });
}
