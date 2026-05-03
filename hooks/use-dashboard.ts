import { getFirstUser } from '@/database/repositories/user-repository';
import {
  getRecentSessions,
  getTodayTotalMinutes,
} from '@/database/repositories/study-session-repository';
import type { StudyRecord } from '@/types/study';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

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

const TARGET_MINUTES = 180;

export interface DashboardResult {
  userName: string;
  nickname: string;
  goal: { targetMinutes: number; studiedMinutes: number };
  recentRecords: StudyRecord[];
  progressRatio: number;
  remainingMinutes: number;
  formattedDate: string;
  loading: boolean;
}

export function useDashboard(): DashboardResult {
  const db = useSQLiteContext();
  const [userName, setUserName] = useState('');
  const [nickname, setNickname] = useState('');
  const [studiedMinutes, setStudiedMinutes] = useState(0);
  const [recentRecords, setRecentRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        const [user, todayMinutes, sessions] = await Promise.all([
          getFirstUser(db),
          getTodayTotalMinutes(db),
          getRecentSessions(db),
        ]);
        if (!active) return;
        setUserName(user?.name ?? '');
        setNickname(user?.nickname ?? '');
        setStudiedMinutes(todayMinutes);
        setRecentRecords(
          sessions.map(s => ({
            id: String(s.id),
            subject: s.subjectName,
            topic: s.notes ?? '',
            durationMinutes: s.durationMinutes,
            startedAt: s.startedAt,
            iconLetter: s.subjectIconLetter,
          }))
        );
        setLoading(false);
      }

      load();
      return () => {
        active = false;
      };
    }, [db])
  );

  const progressRatio = Math.min(studiedMinutes / TARGET_MINUTES, 1);
  const remainingMinutes = Math.max(TARGET_MINUTES - studiedMinutes, 0);

  return {
    userName,
    nickname,
    goal: { targetMinutes: TARGET_MINUTES, studiedMinutes },
    recentRecords,
    progressRatio,
    remainingMinutes,
    formattedDate: formatDate(new Date()),
    loading,
  };
}
