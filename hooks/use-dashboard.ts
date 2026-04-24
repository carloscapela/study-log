import { MOCK_DAILY_GOAL, MOCK_STUDY_RECORDS, MOCK_USER_NAME } from '@/data/mock-study-data';
import type { DashboardData } from '@/types/study';
import { useMemo } from 'react';

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

function formatDate(date: Date): string {
  const raw = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
  return raw.toUpperCase().replace(/\./g, '').replace(' DE ', ', ');
}

export function formatRecordTime(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${isToday ? 'hoje' : 'ontem'}, ${hh}:${mm}`;
}

interface DashboardResult extends DashboardData {
  progressRatio: number;
  remainingMinutes: number;
  formattedDate: string;
}

export function useDashboard(): DashboardResult {
  return useMemo(() => {
    const goal = MOCK_DAILY_GOAL;
    const progressRatio = Math.min(goal.studiedMinutes / goal.targetMinutes, 1);
    const remainingMinutes = Math.max(goal.targetMinutes - goal.studiedMinutes, 0);

    return {
      userName: MOCK_USER_NAME,
      goal,
      recentRecords: MOCK_STUDY_RECORDS,
      progressRatio,
      remainingMinutes,
      formattedDate: formatDate(new Date()),
    };
  }, []);
}
