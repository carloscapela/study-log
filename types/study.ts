export interface User {
  id: number;
  name: string;
  nickname: string;
  createdAt: string;
}

export interface Subject {
  id: number;
  name: string;
  iconLetter: string;
  createdAt: string;
}

export interface StudySession {
  id: number;
  subjectId: number;
  durationMinutes: number;
  startedAt: string; // ISO-8601
  notes: string | null;
  createdAt: string;
}

export interface StudySessionWithSubject extends StudySession {
  subjectName: string;
  subjectIconLetter: string;
}

// Legacy shape kept for mock data / dashboard display
export interface StudyRecord {
  id: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  startedAt: string;
  iconLetter: string;
}

export interface DailyGoal {
  targetMinutes: number;
  studiedMinutes: number;
}

export interface DashboardData {
  userName: string;
  goal: DailyGoal;
  recentRecords: StudyRecord[];
}
