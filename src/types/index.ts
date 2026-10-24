export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserRole = 'owner' | 'maintainer' | 'member' | 'trainee' | 'viewer' | 'custom';

export interface CustomPermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canViewTasks: boolean;
  canManageMembers: boolean;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role?: UserRole;
  avatarUrl?: string;
  photoURL?: string;
  createdAt: string;
}

export interface ProjectMemberDetail {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'maintainer' | 'member' | 'trainee' | 'viewer' | 'custom' | string;
  avatarUrl?: string;
  photoURL?: string;
  domainTitle?: string;
  joinedAt?: string;
  customPermissions?: CustomPermissions | null;
}

export interface AdminOverviewData {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  }>;
  timestamp: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  photoURL?: string;
  createdAt: string;
  projectsCount: number;
  tasksCount: number;
  passwordSecurity: {
    algorithm: string;
    status: string;
    hashPreview: string;
  };
}

export interface AdminProjectRecord {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  tasksCount: number;
  doneTasksCount: number;
  completionRate: number;
}

export interface AdminTaskRecord {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  createdBy: string;
  creatorName: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string; // 3-80 characters
  description?: string; // max 1000 characters
  ownerId: string;
  memberIds: string[]; // includes ownerId
  memberDetails?: Record<string, ProjectMemberDetail>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string; // 3-120 characters
  description?: string; // max 1000 characters
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  createdBy: string;
  creatorName?: string | null;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface CompletionTrendPoint {
  date: string;
  day: string;
  completed: number;
  created: number;
}

export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  overdueCount: number;
  completionTrends?: CompletionTrendPoint[];
}

export interface UserSettings {
  userId?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderHours: number;
  theme?: string;
  language?: string;
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large' | string;
  dateFormat?: string;
  timezone?: string;
  updatedAt?: string;
}

export interface DueSoonTaskItem {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  status?: 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  isDeleted?: boolean;
  replyToId?: string | null;
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingSession {
  id: string;
  projectId: string;
  title: string;
  roomUrl: string;
  hostId: string;
  hostName: string;
  status: 'active' | 'scheduled' | 'ended';
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingParticipant {
  id: string;
  projectId: string;
  userId: string;
  displayName: string;
  peerId: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  lastHeartbeat: string;
  joinedAt: string;
}

export interface MeetingSignal {
  id: string;
  projectId: string;
  fromPeerId: string;
  toPeerId: string;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  createdAt: string;
}
