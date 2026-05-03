import type { SQLiteDatabase } from 'expo-sqlite';

export type GoalStatus = 'active' | 'archived';

export interface StudyGoal {
  id: number;
  userId: number;
  contestName: string;
  dailyMinutes: number;
  status: GoalStatus;
  createdAt: string;
}

type GoalRow = {
  id: number;
  user_id: number;
  contest_name: string;
  daily_minutes: number;
  status: string;
  created_at: string;
};

function toGoal(row: GoalRow): StudyGoal {
  return {
    id: row.id,
    userId: row.user_id,
    contestName: row.contest_name,
    dailyMinutes: row.daily_minutes,
    status: row.status as GoalStatus,
    createdAt: row.created_at,
  };
}

export async function createGoal(
  db: SQLiteDatabase,
  data: { userId: number; contestName: string; dailyMinutes: number }
): Promise<StudyGoal> {
  await db.runAsync(
    `UPDATE study_goals SET status = 'archived' WHERE user_id = ? AND status = 'active'`,
    data.userId
  );

  const result = await db.runAsync(
    `INSERT INTO study_goals (user_id, contest_name, daily_minutes, status)
     VALUES (?, ?, ?, 'active')`,
    data.userId,
    data.contestName,
    data.dailyMinutes
  );

  const row = await db.getFirstAsync<GoalRow>(
    'SELECT * FROM study_goals WHERE id = ?',
    result.lastInsertRowId
  );
  return toGoal(row!);
}

export async function getActiveGoal(
  db: SQLiteDatabase,
  userId?: number
): Promise<StudyGoal | null> {
  const row =
    userId !== undefined
      ? await db.getFirstAsync<GoalRow>(
          `SELECT * FROM study_goals WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`,
          userId
        )
      : await db.getFirstAsync<GoalRow>(
          `SELECT * FROM study_goals WHERE status = 'active' ORDER BY id DESC LIMIT 1`
        );
  return row ? toGoal(row) : null;
}

export async function getUserGoals(db: SQLiteDatabase, userId: number): Promise<StudyGoal[]> {
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT * FROM study_goals WHERE user_id = ? ORDER BY created_at DESC`,
    userId
  );
  return rows.map(toGoal);
}

export async function archiveGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`UPDATE study_goals SET status = 'archived' WHERE id = ?`, id);
}

export async function activateGoal(db: SQLiteDatabase, id: number, userId: number): Promise<void> {
  await db.runAsync(
    `UPDATE study_goals SET status = 'archived' WHERE user_id = ? AND status = 'active'`,
    userId
  );
  await db.runAsync(`UPDATE study_goals SET status = 'active' WHERE id = ?`, id);
}

export async function updateGoal(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Pick<StudyGoal, 'contestName' | 'dailyMinutes'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.contestName !== undefined) {
    fields.push('contest_name = ?');
    values.push(data.contestName);
  }
  if (data.dailyMinutes !== undefined) {
    fields.push('daily_minutes = ?');
    values.push(data.dailyMinutes);
  }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE study_goals SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM study_goals WHERE id = ?', id);
}
