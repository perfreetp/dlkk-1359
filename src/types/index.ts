export type TaskType = 'product' | 'service' | 'image';
export type TaskSubType = 'title' | 'selling_point' | 'bad_review' | 'sms' | 'competitor' | 'background' | 'crop';
export type UserRole = 'operator' | 'manager';
export type TaskStatus = 'pending' | 'completed' | 'marked' | 'warning';
export type ToneType = 'professional' | 'friendly' | 'luxury' | 'playful';
export type SensitiveLevel = 'warning' | 'danger';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  teamId?: string;
  team?: string;
  createdAt: string;
}

export interface BrandTone {
  id: string;
  name: string;
  description: string;
  style: string;
  tone?: ToneType;
  keywords?: string[];
  forbiddenWords?: string[];
  isDefault: boolean;
}

export interface SensitiveWord {
  word: string;
  position: number;
  level: SensitiveLevel;
  suggestion: string;
}

export interface TaskOutput {
  id: string;
  content: string;
  sensitiveWords: SensitiveWord[];
  isMarked: boolean;
  createdAt: string;
  imageUrl?: string;
  version?: number;
}

export interface Task {
  id: string;
  type: TaskType;
  subType: TaskSubType;
  title: string;
  inputs: Record<string, any>;
  outputs: TaskOutput[];
  status: TaskStatus;
  markedOutputId?: string;
  createdAt: string;
  userId: string;
  createdBy: string;
  isFavorite: boolean;
  category?: string;
}

export interface Template {
  id: string;
  name: string;
  type: TaskSubType;
  taskType?: TaskType;
  content: string;
  usageCount: number;
  conversionRate?: number;
  createdAt: string;
  toneId?: string;
  categoryId?: string;
  isFavorite?: boolean;
}

export interface UsageStats {
  date: string;
  taskType: TaskType;
  count: number;
  userId: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  usageCount: number;
  lastActive: string;
  taskDistribution: Record<TaskType, number>;
  weeklyUsage: number;
  avgConversionRate: number;
  role: UserRole;
  favoriteCount: number;
  joinDate: string;
}

export interface Category {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  children?: Category[];
}

export const STORAGE_KEYS = {
  CURRENT_USER: 'ai_toolbox_current_user',
  TASKS: 'ai_toolbox_tasks',
  TEMPLATES: 'ai_toolbox_templates',
  BRAND_TONES: 'ai_toolbox_brand_tones',
  USAGE_STATS: 'ai_toolbox_usage_stats',
  TEAM_MEMBERS: 'ai_toolbox_team_members',
  LAST_SELECTED_USER: 'ai_toolbox_last_selected_user',
} as const;
