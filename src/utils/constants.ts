export const APP_NAME = 'EverlyCare';

export const TOILET_REMINDER_INTERVAL_MINUTES = 120; // Every 2 hours

export const FLUID_DAILY_TARGET_ML = 1500;

export const BRISTOL_SCALE = {
  1: 'Separate hard lumps',
  2: 'Lumpy sausage',
  3: 'Cracked sausage',
  4: 'Smooth sausage',
  5: 'Soft blobs',
  6: 'Mushy',
  7: 'Watery',
} as const;

export const LOG_ICONS: Record<string, string> = {
  bowel: 'toilet',
  urination: 'water',
  meal: 'food-apple',
  medication: 'pill',
  mood: 'emoticon-outline',
  hygiene: 'shower-head',
  activity: 'walk',
  note: 'note-text',
};
