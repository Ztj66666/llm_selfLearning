export interface Task {
  id: number;
  date: string;
  task_type: string;
  is_completed: boolean;
  note: string | null;
  data: string | null; // Added data field to store JSON string
}
