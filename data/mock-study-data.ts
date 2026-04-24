import type { DailyGoal, StudyRecord } from '@/types/study';

export const MOCK_USER_NAME = 'Benedito';

export const MOCK_DAILY_GOAL: DailyGoal = {
  targetMinutes: 180,
  studiedMinutes: 150,
};

export const MOCK_STUDY_RECORDS: StudyRecord[] = [
  {
    id: '1',
    subject: 'Matemática',
    topic: 'Cálculo Diferencial',
    durationMinutes: 80,
    startedAt: '2026-04-21T08:15:00',
    iconLetter: 'M',
  },
  {
    id: '2',
    subject: 'Física',
    topic: 'Mecânica Quântica',
    durationMinutes: 45,
    startedAt: '2026-04-21T06:50:00',
    iconLetter: 'F',
  },
  {
    id: '3',
    subject: 'Português',
    topic: 'Análise Sintática',
    durationMinutes: 25,
    startedAt: '2026-04-20T21:30:00',
    iconLetter: 'P',
  },
  {
    id: '4',
    subject: 'História',
    topic: 'Brasil Império',
    durationMinutes: 65,
    startedAt: '2026-04-20T19:00:00',
    iconLetter: 'H',
  },
];
