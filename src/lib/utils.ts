/**
 * Common utilities for ExamKraft
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXP(xp: number) {
  return xp.toLocaleString();
}

/**
 * Calculates level from XP using logarithmic scale
 * Level = floor(sqrt(xp/100)) + 1
 */
export function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForLevel(level: number) {
  return Math.pow(level - 1, 2) * 100;
}

export function getProgressToNextLevel(xp: number) {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}
