import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './schema';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const sql of MIGRATIONS) {
      await db.execAsync(sql);
    }
  });
}

export * from './repositories/user-repository';
export * from './repositories/subject-repository';
export * from './repositories/study-session-repository';
