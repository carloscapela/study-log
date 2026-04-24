import type { SQLiteDatabase } from 'expo-sqlite';
import type { Subject } from '@/types/study';

type SubjectRow = { id: number; name: string; icon_letter: string; created_at: string };

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    iconLetter: row.icon_letter,
    createdAt: row.created_at,
  };
}

export async function createSubject(
  db: SQLiteDatabase,
  data: Pick<Subject, 'name' | 'iconLetter'>
): Promise<Subject> {
  const result = await db.runAsync(
    'INSERT INTO subjects (name, icon_letter) VALUES (?, ?)',
    data.name,
    data.iconLetter
  );
  const row = await db.getFirstAsync<SubjectRow>(
    'SELECT * FROM subjects WHERE id = ?',
    result.lastInsertRowId
  );
  return toSubject(row!);
}

export async function getAllSubjects(db: SQLiteDatabase): Promise<Subject[]> {
  const rows = await db.getAllAsync<SubjectRow>(
    'SELECT * FROM subjects ORDER BY name'
  );
  return rows.map(toSubject);
}

export async function getSubjectById(
  db: SQLiteDatabase,
  id: number
): Promise<Subject | null> {
  const row = await db.getFirstAsync<SubjectRow>('SELECT * FROM subjects WHERE id = ?', id);
  return row ? toSubject(row) : null;
}

export async function updateSubject(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Pick<Subject, 'name' | 'iconLetter'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.iconLetter !== undefined) { fields.push('icon_letter = ?'); values.push(data.iconLetter); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteSubject(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM subjects WHERE id = ?', id);
}
