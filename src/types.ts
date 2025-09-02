export interface Task {
  id: string;
  title: string;
  description?: string | null;
  done: boolean;
  completeTill?: string | null; // ✅ added
  createdAt?: string | null;
  updatedAt?: string | null;
}
