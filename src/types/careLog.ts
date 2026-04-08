export type LogType =
  | 'bowel'
  | 'urination'
  | 'meal'
  | 'medication'
  | 'mood'
  | 'hygiene'
  | 'activity'
  | 'note';

export interface CareLog {
  id: string;
  careRecipientId: string;
  loggedBy: string;
  logType: LogType;
  occurredAt: string; // ISO timestamp
  data: LogData;
  notes?: string;
  createdAt: string;
}

export type LogData =
  | BowelLogData
  | UrinationLogData
  | MealLogData
  | MedicationLogData
  | MoodLogData
  | HygieneLogData
  | ActivityLogData
  | NoteLogData;

export interface BowelLogData {
  type: 'normal' | 'diarrhea' | 'constipation';
  isAccident: boolean;
  location: 'toilet' | 'diaper' | 'other';
  bristolScale?: number; // 1-7
  amount?: 'small' | 'medium' | 'large';
}

export interface UrinationLogData {
  method: 'planned' | 'spontaneous' | 'accident';
  volume: 'small' | 'medium' | 'large';
  isIncontinence: boolean;
  location?: string;
}

export interface MealLogData {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'fluid';
  description?: string;
  fluidAmountMl?: number;
  appetite?: 'good' | 'fair' | 'poor';
}

export interface MedicationLogData {
  medicationId?: string;
  medicationName: string;
  dosage?: string;
  status: 'taken' | 'missed' | 'skipped';
}

export interface MoodLogData {
  mood: 'calm' | 'happy' | 'anxious' | 'agitated' | 'confused' | 'sad';
  sleepQuality?: 'good' | 'fair' | 'poor';
  behaviorNotes?: string;
}

export interface HygieneLogData {
  type: 'bathing' | 'clothingChange' | 'skinCheck' | 'oralCare';
  skinCondition?: 'normal' | 'redness' | 'breakdown';
}

export interface ActivityLogData {
  activityType: 'walking' | 'exercise' | 'social' | 'cognitive' | 'rest';
  durationMinutes?: number;
}

export interface NoteLogData {
  content: string;
}

// Log type metadata for UI rendering
export const LOG_TYPE_CONFIG: Record<
  LogType,
  { icon: string; labelKey: string; color: string }
> = {
  bowel: { icon: 'toilet', labelKey: 'careLog.bowel', color: '#8B6914' },
  urination: { icon: 'water', labelKey: 'careLog.urination', color: '#2980B9' },
  meal: { icon: 'food-apple', labelKey: 'careLog.meal', color: '#E67E22' },
  medication: { icon: 'pill', labelKey: 'careLog.medication', color: '#9B59B6' },
  mood: { icon: 'emoticon-outline', labelKey: 'careLog.mood', color: '#F1C40F' },
  hygiene: { icon: 'shower-head', labelKey: 'careLog.hygiene', color: '#1ABC9C' },
  activity: { icon: 'walk', labelKey: 'careLog.activity', color: '#E74C3C' },
  note: { icon: 'note-text', labelKey: 'careLog.note', color: '#95A5A6' },
};
