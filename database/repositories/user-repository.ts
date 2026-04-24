import type { SQLiteDatabase } from 'expo-sqlite';
import type { User } from '@/types/study';

type UserRow = { id: number; name: string; nickname: string; created_at: string };

function toUser(row: UserRow): User {
  return { id: row.id, name: row.name, nickname: row.nickname, createdAt: row.created_at };
}

export async function createUser(
  db: SQLiteDatabase,
  data: Pick<User, 'name' | 'nickname'>
): Promise<User> {
  const result = await db.runAsync(
    'INSERT INTO users (name, nickname) VALUES (?, ?)',
    data.name,
    data.nickname
  );
  const row = await db.getFirstAsync<UserRow>(
    'SELECT * FROM users WHERE id = ?',
    result.lastInsertRowId
  );
  return toUser(row!);
}

export async function getFirstUser(db: SQLiteDatabase): Promise<User | null> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users ORDER BY id LIMIT 1');
  return row ? toUser(row) : null;
}

export async function updateUser(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Pick<User, 'name' | 'nickname'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
}
