import * as SecureStore from 'expo-secure-store';

const STREAK_LAST_DATE_KEY = 'eco_streak_last_date';
const STREAK_COUNT_KEY = 'eco_streak_count';

export interface StreakData {
  currentStreak: number;
  lastCheckDate: string | null;
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

export async function getStreak(): Promise<StreakData> {
  try {
    const lastDate = await SecureStore.getItemAsync(STREAK_LAST_DATE_KEY);
    const countStr = await SecureStore.getItemAsync(STREAK_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return { currentStreak: count, lastCheckDate: lastDate };
  } catch {
    return { currentStreak: 0, lastCheckDate: null };
  }
}

export async function recordDailyCheck(): Promise<StreakData> {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let lastDate: string | null = null;
  let currentCount = 0;

  try {
    lastDate = await SecureStore.getItemAsync(STREAK_LAST_DATE_KEY);
    const countStr = await SecureStore.getItemAsync(STREAK_COUNT_KEY);
    currentCount = countStr ? parseInt(countStr, 10) : 0;
  } catch {
    // ignore read errors
  }

  if (lastDate === today) {
    return { currentStreak: currentCount, lastCheckDate: today };
  }

  let newCount: number;
  if (lastDate === yesterday) {
    newCount = currentCount + 1;
  } else {
    newCount = 1;
  }

  try {
    await SecureStore.setItemAsync(STREAK_COUNT_KEY, newCount.toString());
    await SecureStore.setItemAsync(STREAK_LAST_DATE_KEY, today);
  } catch {
    // ignore write errors
  }

  return { currentStreak: newCount, lastCheckDate: today };
}

export function getStreakIcon(streak: number): string {
  if (streak >= 30) return 'flame';
  if (streak >= 14) return 'star';
  if (streak >= 7) return 'trophy';
  if (streak >= 3) return 'flash';
  return 'leaf';
}

export function getStreakMessage(streak: number): string {
  if (streak >= 30) return 'Legendary Eco Guardian!';
  if (streak >= 14) return 'Dedicated Monitor!';
  if (streak >= 7) return 'Rising Protector!';
  if (streak >= 3) return 'Getting Started!';
  return 'Start your streak!';
}
