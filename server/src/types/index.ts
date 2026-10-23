import { Request } from 'express';
import { CustomPermissions } from '../lib/permissions.js';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserRole = 'owner' | 'maintainer' | 'member' | 'trainee' | 'viewer' | 'custom';

export interface UserProfile {
  id: string;
  uid: string; // compatibility alias for frontend
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface ProjectMemberDetail {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt?: string;
  customPermissions?: CustomPermissions | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  memberDetails?: Record<string, ProjectMemberDetail>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  createdBy: string;
  creatorName?: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
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

export interface MeetingSession {
  id: string;
  projectId: string;
  title: string;
  roomUrl: string;
  hostId: string;
  hostName: string;
  status: 'active' | 'scheduled' | 'ended';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  token: string;
  user: UserProfile;
}
