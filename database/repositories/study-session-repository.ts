import type { SQLiteDatabase } from 'expo-sqlite';
import type { StudySession, StudySessionWithSubject } from '@/types/study';

type SessionRow = {
  id: number;
  subject_id: number;
  goal_id: number | null;
  duration_minutes: number;
  started_at: string;
  notes: string | null;
  created_at: string;
};

type SessionWithSubjectRow = SessionRow & {
  subject_name: string;
  subject_icon_letter: string;
};

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    goalId: row.goal_id,
    durationMinutes: row.duration_minutes,
    startedAt: row.started_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toSessionWithSubject(row: SessionWithSubjectRow): StudySessionWithSubject {
  return {
    ...toSession(row),
    subjectName: row.subject_name,
    subjectIconLetter: row.subject_icon_letter,
  };
}

export async function getAllSessionsWithSubject(
  db: SQLiteDatabase
): Promise<StudySessionWithSubject[]> {
  const rows = await db.getAllAsync<SessionWithSubjectRow>(
    `SELECT ss.*, s.name AS subject_name, s.icon_letter AS subject_icon_letter
     FROM study_sessions ss
     JOIN subjects s ON s.id = ss.subject_id
     ORDER BY ss.started_at DESC`
  );
  return rows.map(toSessionWithSubject);
}

export async function createStudySession(
  db: SQLiteDatabase,
  data: Pick<StudySession, 'subjectId' | 'durationMinutes' | 'startedAt' | 'notes'> & { goalId?: number | null }
): Promise<StudySession> {
  const result = await db.runAsync(
    'INSERT INTO study_sessions (subject_id, goal_id, duration_minutes, started_at, notes) VALUES (?, ?, ?, ?, ?)',
    data.subjectId,
    data.goalId ?? null,
    data.durationMinutes,
    data.startedAt,
    data.notes ?? null
  );
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM study_sessions WHERE id = ?',
    result.lastInsertRowId
  );
  return toSession(row!);
}

export async function getRecentSessions(
  db: SQLiteDatabase,
  limit = 10
): Promise<StudySessionWithSubject[]> {
  const rows = await db.getAllAsync<SessionWithSubjectRow>(
    `SELECT ss.*, s.name AS subject_name, s.icon_letter AS subject_icon_letter
     FROM study_sessions ss
     JOIN subjects s ON s.id = ss.subject_id
     ORDER BY ss.started_at DESC
     LIMIT ?`,
    limit
  );
  return rows.map(toSessionWithSubject);
}

export async function getTodayTotalMinutes(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0) AS total
     FROM study_sessions
     WHERE date(started_at) = date('now')`
  );
  return row?.total ?? 0;
}

export async function deleteStudySession(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM study_sessions WHERE id = ?', id);
}

export interface ProfileStats {
  totalSessions: number;
  totalHours: number;
  streakDays: number;
}

export async function getProfileStats(db: SQLiteDatabase): Promise<ProfileStats> {
  const totals = await db.getFirstAsync<{ sessions: number; minutes: number }>(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM study_sessions`
  );

  // Streak: fetch distinct study dates descending and count consecutive days from today
  const dates = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(started_at) AS day
     FROM study_sessions
     ORDER BY day DESC
     LIMIT 365`
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates[i].day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalSessions: totals?.sessions ?? 0,
    totalHours: Math.round((totals?.minutes ?? 0) / 60),
    streakDays: streak,
  };
}
