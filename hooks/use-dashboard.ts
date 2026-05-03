import { getActiveGoal } from "@/database/repositories/study-goal-repository";
import {
  getRecentSessions,
  getTodayTotalMinutes,
} from "@/database/repositories/study-session-repository";
import { getFirstUser } from "@/database/repositories/user-repository";
import type { StudySessionWithSubject } from "@/types/study";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${String(m).padStart(2, "0")}min`;
}

function formatDate(date: Date): string {
    const raw = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "short",
    }).format(date);
    return raw.toUpperCase().replace(/\./g, "").replace(" DE ", ", ");
}

export function formatRecordTime(isoString: string): string {
    const date = new Date(isoString);
    const today = new Date();
    const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${isToday ? "hoje" : "ontem"}, ${hh}:${mm}`;
}

const DEFAULT_TARGET_MINUTES = 180;

export interface DashboardResult {
    userName: string;
    nickname: string;
    goal: { targetMinutes: number; studiedMinutes: number };
    recentRecords: StudySessionWithSubject[];
    progressRatio: number;
    remainingMinutes: number;
    formattedDate: string;
    loading: boolean;
}

export function useDashboard(): DashboardResult {
    const db = useSQLiteContext();
    const [userName, setUserName] = useState("");
    const [nickname, setNickname] = useState("");
    const [studiedMinutes, setStudiedMinutes] = useState(0);
    const [targetMinutes, setTargetMinutes] = useState(DEFAULT_TARGET_MINUTES);
    const [recentRecords, setRecentRecords] = useState<StudySessionWithSubject[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            async function load() {
                setLoading(true);
                const [user, todayMinutes, sessions, activeGoal] = await Promise.all([
                    getFirstUser(db),
                    getTodayTotalMinutes(db),
                    getRecentSessions(db),
                    getActiveGoal(db),
                ]);
                if (!active) return;
                setUserName(user?.name ?? "");
                setNickname(user?.nickname ?? "");
                setStudiedMinutes(todayMinutes);
                setTargetMinutes(activeGoal?.dailyMinutes ?? DEFAULT_TARGET_MINUTES);
                setRecentRecords(sessions);
                setLoading(false);
            }

            load();
            return () => {
                active = false;
            };
        }, [db]),
    );

    const progressRatio = Math.min(studiedMinutes / targetMinutes, 1);
    const remainingMinutes = Math.max(targetMinutes - studiedMinutes, 0);

    return {
        userName,
        nickname,
        goal: { targetMinutes, studiedMinutes },
        recentRecords,
        progressRatio,
        remainingMinutes,
        formattedDate: formatDate(new Date()),
        loading,
    };
}
