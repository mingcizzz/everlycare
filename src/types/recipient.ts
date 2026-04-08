export interface CareRecipient {
  id: string;
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  medicalConditions: string[];
  allergies: string[];
  notes?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  careRecipientId: string;
  name: string;
  dosage?: string;
  frequency: 'daily' | 'twice_daily' | 'three_daily' | 'weekly' | 'as_needed';
  scheduleTimes: string[]; // HH:mm format
  isActive: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  careRecipientId: string;
  createdBy: string;
  title: string;
  reminderType: 'toilet' | 'medication' | 'fluid' | 'custom';
  schedule: ReminderSchedule;
  isActive: boolean;
  createdAt: string;
}

export interface ReminderSchedule {
  intervalMinutes?: number; // For recurring (e.g., every 120 min)
  times?: string[]; // Specific times of day HH:mm
  daysOfWeek?: number[]; // 0=Sun, 6=Sat
}

export interface CareTeamMember {
  id: string;
  careRecipientId: string;
  userId: string;
  role: 'primary' | 'member' | 'viewer';
  displayName?: string;
  avatarUrl?: string;
  invitedAt: string;
  acceptedAt?: string;
}
