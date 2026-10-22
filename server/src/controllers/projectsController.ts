import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest, Project, ProjectMemberDetail } from '../types/index.js';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  createMessageSchema,
  updateMessageSchema,
  updateMeetingSchema,
  joinMeetingSchema,
  meetingHeartbeatSchema,
  meetingSignalSchema,
} from '../validators/schemas.js';

interface DBProject {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface DBMemberRow {
  user_id: string;
  role: 'owner' | 'maintainer' | 'member' | 'trainee' | 'viewer';
  joined_at: string;
  email: string;
  display_name: string;
}

async function getProjectMembersMap(projectId: string): Promise<{
  memberIds: string[];
  memberDetails: Record<string, ProjectMemberDetail>;
}> {
  const rows = await dbAll<DBMemberRow>(
    `SELECT pm.user_id, pm.role, pm.joined_at, u.email, u.display_name
     FROM project_members pm
     INNER JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?`,
    [projectId]
  );

  const memberIds: string[] = [];
  const memberDetails: Record<string, ProjectMemberDetail> = {};

  for (const row of rows) {
    memberIds.push(row.user_id);
    memberDetails[row.user_id] = {
      id: row.user_id,
      uid: row.user_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      joinedAt: row.joined_at,
    };
  }

  return { memberIds, memberDetails };
}

async function getProjectsMembersBatchMap(projectIds: string[]): Promise<
  Record<string, { memberIds: string[]; memberDetails: Record<string, ProjectMemberDetail> }>
> {
  if (projectIds.length === 0) return {};

  const placeholders = projectIds.map(() => '?').join(',');
  const rows = await dbAll<DBMemberRow & { project_id: string }>(
    `SELECT pm.project_id, pm.user_id, pm.role, pm.joined_at, u.email, u.display_name
     FROM project_members pm
     INNER JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id IN (${placeholders})`,
    projectIds
  );

  const result: Record<string, { memberIds: string[]; memberDetails: Record<string, ProjectMemberDetail> }> = {};
  for (const pid of projectIds) {
    result[pid] = { memberIds: [], memberDetails: {} };
  }

  for (const row of rows) {
    if (!result[row.project_id]) {
      result[row.project_id] = { memberIds: [], memberDetails: {} };
    }
    result[row.project_id].memberIds.push(row.user_id);
    result[row.project_id].memberDetails[row.user_id] = {
      id: row.user_id,
      uid: row.user_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      joinedAt: row.joined_at,
    };
  }

  return result;
}

export const listProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id || req.user!.uid;

    const rows = await dbAll<DBProject>(
      `SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at
       FROM projects p
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = ?
       ORDER BY p.updated_at DESC`,
      [userId]
    );

    const projectIds = rows.map((p) => p.id);
    const membersBatch = await getProjectsMembersBatchMap(projectIds);

    const projects: Project[] = rows.map((p) => {
      const members = membersBatch[p.id] || { memberIds: [], memberDetails: {} };
      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        ownerId: p.owner_id,
        memberIds: members.memberIds,
        memberDetails: members.memberDetails,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createProjectSchema.parse(req.body);
    const user = req.user!;
    const userId = user.id || user.uid;

    const projectId = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO projects (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId, validated.name, validated.description || '', userId, now, now]
    );

    await dbRun(
      `INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)`,
      [projectId, userId, now]
    );

    const memberDetails: Record<string, ProjectMemberDetail> = {
      [userId]: {
        id: userId,
        uid: userId,
        email: user.email,
        displayName: user.displayName,
        role: 'owner',
        joinedAt: now,
      },
    };

    const newProject: Project = {
      id: projectId,
      name: validated.name,
      description: validated.description || '',
      ownerId: userId,
      memberIds: [userId],
      memberDetails,
      createdAt: now,
      updatedAt: now,
    };

    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;

    const project = await dbGet<DBProject>(
      `SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found in SQL database.', 'NOT_FOUND');
    }

    // Verify membership
    const membership = await dbGet<{ user_id: string }>(
      `SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!membership && project.owner_id !== userId) {
      throw new AppError(403, 'Access denied: You are not a member of this project.', 'FORBIDDEN');
    }

    const { memberIds, memberDetails } = await getProjectMembersMap(id);

    const response: Project = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      ownerId: project.owner_id,
      memberIds,
      memberDetails,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const validated = updateProjectSchema.parse(req.body);

    const project = await dbGet<DBProject>(
      `SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found in SQL database.', 'NOT_FOUND');
    }

    if (project.owner_id !== userId) {
      throw new AppError(403, 'Only the project owner can update project settings.', 'FORBIDDEN');
    }

    const now = new Date().toISOString();
    const newName = validated.name !== undefined ? validated.name : project.name;
    const newDesc = validated.description !== undefined ? validated.description : project.description;

    await dbRun(
      `UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
      [newName, newDesc, now, id]
    );

    const { memberIds, memberDetails } = await getProjectMembersMap(id);

    res.status(200).json({
      id,
      name: newName,
      description: newDesc,
      ownerId: project.owner_id,
      memberIds,
      memberDetails,
      createdAt: project.created_at,
      updatedAt: now,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;

    const project = await dbGet<DBProject>(
      `SELECT id, owner_id FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found in SQL database.', 'NOT_FOUND');
    }

    if (project.owner_id !== userId) {
      throw new AppError(403, 'Only the project owner can delete this project.', 'FORBIDDEN');
    }

    // SQLite foreign keys ON DELETE CASCADE will automatically clean tasks and project_members
    await dbRun(`DELETE FROM projects WHERE id = ?`, [id]);

    res.status(200).json({
      message: 'Project and all associated tasks deleted successfully from SQL database.',
      projectId: id,
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const { email, role = 'member' } = addMemberSchema.parse(req.body);

    const project = await dbGet<DBProject>(
      `SELECT id, owner_id FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found.', 'NOT_FOUND');
    }

    // Check if caller is owner or maintainer
    const callerMember = await dbGet<{ role: string }>(
      `SELECT role FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, userId]
    );

    const canManageMembers =
      project.owner_id === userId ||
      callerMember?.role === 'owner' ||
      callerMember?.role === 'maintainer';

    if (!canManageMembers) {
      throw new AppError(403, 'Only project owners and maintainers can add members.', 'FORBIDDEN');
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetUser = await dbGet<{ id: string; email: string; display_name: string; role: string }>(
      `SELECT id, email, display_name, role FROM users WHERE email = ?`,
      [cleanEmail]
    );

    if (!targetUser) {
      throw new AppError(404, `No registered user found with email "${email}". User must register an account first.`, 'USER_NOT_FOUND');
    }

    const alreadyMember = await dbGet<{ user_id: string }>(
      `SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, targetUser.id]
    );

    if (alreadyMember) {
      throw new AppError(400, `User "${email}" is already a member of this project.`, 'ALREADY_MEMBER');
    }

    const assignedRole = role === 'owner' ? 'maintainer' : role; // Only original creator is workspace owner
    const now = new Date().toISOString();
    await dbRun(
      `INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
      [id, targetUser.id, assignedRole, now]
    );

    const { memberIds, memberDetails } = await getProjectMembersMap(id);

    res.status(200).json({
      message: 'Member added successfully.',
      projectId: id,
      memberIds,
      memberDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const { role } = updateMemberRoleSchema.parse(req.body);

    const project = await dbGet<DBProject>(
      `SELECT id, owner_id FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found.', 'NOT_FOUND');
    }

    // Check if caller is owner or maintainer
    const callerMember = await dbGet<{ role: string }>(
      `SELECT role FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, userId]
    );

    const canManageMembers =
      project.owner_id === userId ||
      callerMember?.role === 'owner' ||
      callerMember?.role === 'maintainer';

    if (!canManageMembers) {
      throw new AppError(403, 'Only project owners and maintainers can modify roles.', 'FORBIDDEN');
    }

    // Cannot demote or change the original project owner's role
    if (memberId === project.owner_id) {
      throw new AppError(400, 'Project workspace owner role cannot be changed.', 'CANNOT_MODIFY_OWNER');
    }

    const targetMembership = await dbGet<{ role: string }>(
      `SELECT role FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, memberId]
    );

    if (!targetMembership) {
      throw new AppError(404, 'Member not found in this project.', 'NOT_A_MEMBER');
    }

    await dbRun(
      `UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?`,
      [role, id, memberId]
    );

    const { memberIds, memberDetails } = await getProjectMembersMap(id);

    res.status(200).json({
      message: 'Member role updated successfully.',
      projectId: id,
      updatedMemberId: memberId,
      newRole: role,
      memberIds,
      memberDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id || req.user!.uid;

    const project = await dbGet<DBProject>(
      `SELECT id, owner_id FROM projects WHERE id = ?`,
      [id]
    );

    if (!project) {
      throw new AppError(404, 'Project not found.', 'NOT_FOUND');
    }

    if (project.owner_id !== userId) {
      throw new AppError(403, 'Only the project owner can remove members.', 'FORBIDDEN');
    }

    if (memberId === project.owner_id) {
      throw new AppError(400, 'Project owner cannot be removed from their own project.', 'CANNOT_REMOVE_OWNER');
    }

    const now = new Date().toISOString();
    await dbRun(
      `DELETE FROM project_members WHERE project_id = ? AND user_id = ?`,
      [id, memberId]
    );

    // Unassign tasks assigned to removed member
    await dbRun(
      `UPDATE tasks SET assignee_id = NULL, updated_at = ? WHERE project_id = ? AND assignee_id = ?`,
      [now, id, memberId]
    );

    const { memberIds, memberDetails } = await getProjectMembersMap(id);

    res.status(200).json({
      message: 'Member removed and tasks unassigned successfully.',
      projectId: id,
      removedMemberId: memberId,
      memberIds,
      memberDetails,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Team Chat & Live Conference Controllers (Custom Native Implementation)
// ============================================================================

interface DBMessageRow {
  id: string;
  project_id: string;
  user_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  status?: string;
  is_edited?: number;
  is_deleted?: number;
  reply_to_id?: string | null;
  mentions?: string | null;
  created_at: string;
  updated_at?: string;
}

interface DBMeetingRow {
  id: string;
  project_id: string;
  title: string;
  room_url: string;
  host_id: string;
  host_name: string;
  status: 'active' | 'scheduled' | 'ended';
  created_at: string;
  updated_at: string;
}

interface DBParticipantRow {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string;
  peer_id: string;
  is_muted: number;
  is_video_off: number;
  is_screen_sharing: number;
  is_hand_raised: number;
  last_heartbeat: string;
  joined_at: string;
}

interface DBSignalRow {
  id: string;
  project_id: string;
  from_peer_id: string;
  to_peer_id: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  payload: string;
  created_at: string;
}

async function checkProjectAccess(projectId: string, userId: string): Promise<DBProject> {
  const project = await dbGet<DBProject>(
    `SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id = ?`,
    [projectId]
  );
  if (!project) {
    throw new AppError(404, 'Project not found.', 'NOT_FOUND');
  }
  if (project.owner_id === userId) {
    return project;
  }
  const membership = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM project_members WHERE project_id = ? AND user_id = ?`,
    [projectId, userId]
  );
  if (!membership) {
    throw new AppError(403, 'You do not have permission to access this project.', 'FORBIDDEN');
  }
  return project;
}

// --- Team Chat Endpoints ---

export const getProjectMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    // Update status to 'delivered' for any sent messages
    await dbRun(
      `UPDATE project_messages SET status = 'delivered' WHERE project_id = ? AND user_id != ? AND status = 'sent'`,
      [id, userId]
    );

    const rows = await dbAll<DBMessageRow>(
      `SELECT id, project_id, user_id, sender_name, sender_email, content, status, is_edited, is_deleted, reply_to_id, mentions, created_at, updated_at
       FROM project_messages
       WHERE project_id = ?
       ORDER BY created_at ASC
       LIMIT 200`,
      [id]
    );

    const messages = rows.map((r) => {
      let parsedMentions: string[] = [];
      if (r.mentions) {
        try {
          parsedMentions = JSON.parse(r.mentions);
        } catch {
          parsedMentions = [];
        }
      }
      return {
        id: r.id,
        projectId: r.project_id,
        userId: r.user_id,
        senderName: r.sender_name,
        senderEmail: r.sender_email,
        content: r.content,
        status: (r.status || 'delivered') as 'sent' | 'delivered' | 'read',
        isEdited: Boolean(r.is_edited),
        isDeleted: Boolean(r.is_deleted),
        replyToId: r.reply_to_id || null,
        mentions: parsedMentions,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const createProjectMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const user = req.user!;
    await checkProjectAccess(id, userId);

    const parsed = createMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Invalid message payload.', 'VALIDATION_ERROR');
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();
    const senderName = user.displayName || user.email.split('@')[0] || 'Team Member';
    const senderEmail = user.email;
    const mentionsJson = parsed.data.mentions && parsed.data.mentions.length > 0
      ? JSON.stringify(parsed.data.mentions)
      : null;

    await dbRun(
      `INSERT INTO project_messages (id, project_id, user_id, sender_name, sender_email, content, status, is_edited, is_deleted, reply_to_id, mentions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'delivered', 0, 0, ?, ?, ?, ?)`,
      [messageId, id, userId, senderName, senderEmail, parsed.data.content, parsed.data.replyToId || null, mentionsJson, now, now]
    );

    const newMessage = {
      id: messageId,
      projectId: id,
      userId,
      senderName,
      senderEmail,
      content: parsed.data.content,
      status: 'delivered' as const,
      isEdited: false,
      isDeleted: false,
      replyToId: parsed.data.replyToId || null,
      mentions: parsed.data.mentions || [],
      createdAt: now,
      updatedAt: now,
    };

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

export const updateProjectMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    const parsed = updateMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Invalid message payload.', 'VALIDATION_ERROR');
    }

    const existing = await dbGet<DBMessageRow>(
      `SELECT id, user_id, is_deleted FROM project_messages WHERE id = ? AND project_id = ?`,
      [messageId, id]
    );

    if (!existing) {
      throw new AppError(404, 'Message not found.', 'NOT_FOUND');
    }
    if (existing.user_id !== userId) {
      throw new AppError(403, 'You can only edit your own messages.', 'FORBIDDEN');
    }
    if (existing.is_deleted) {
      throw new AppError(400, 'Cannot edit a deleted message.', 'INVALID_OPERATION');
    }

    const now = new Date().toISOString();
    await dbRun(
      `UPDATE project_messages SET content = ?, is_edited = 1, updated_at = ? WHERE id = ?`,
      [parsed.data.content, now, messageId]
    );

    res.status(200).json({
      id: messageId,
      content: parsed.data.content,
      isEdited: true,
      updatedAt: now,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const project = await checkProjectAccess(id, userId);

    const existing = await dbGet<DBMessageRow>(
      `SELECT id, user_id FROM project_messages WHERE id = ? AND project_id = ?`,
      [messageId, id]
    );

    if (!existing) {
      throw new AppError(404, 'Message not found.', 'NOT_FOUND');
    }

    const isAuthor = existing.user_id === userId;
    const isOwner = project.owner_id === userId;
    if (!isAuthor && !isOwner) {
      throw new AppError(403, 'Only message author or project owner can delete messages.', 'FORBIDDEN');
    }

    const now = new Date().toISOString();
    await dbRun(
      `UPDATE project_messages SET content = 'تم حذف هذه الرسالة', is_deleted = 1, updated_at = ? WHERE id = ?`,
      [now, messageId]
    );

    res.status(200).json({
      id: messageId,
      isDeleted: true,
      message: 'Message marked as deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    await dbRun(
      `UPDATE project_messages SET status = 'read' WHERE project_id = ? AND user_id != ? AND status != 'read'`,
      [id, userId]
    );

    res.status(200).json({ success: true, message: 'All messages marked as read.' });
  } catch (error) {
    next(error);
  }
};

// --- Custom Native Meeting & WebRTC Signaling Engine ---

export const getProjectMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const user = req.user!;
    const project = await checkProjectAccess(id, userId);

    let meeting = await dbGet<DBMeetingRow>(
      `SELECT id, project_id, title, room_url, host_id, host_name, status, created_at, updated_at
       FROM project_meetings WHERE project_id = ?`,
      [id]
    );

    if (!meeting) {
      const meetingId = uuidv4();
      const now = new Date().toISOString();
      const cleanProjectName = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'Project';
      const cleanId = id.replace(/-/g, '').slice(0, 8);
      const roomUrl = `taskflow://meeting/${id}/${cleanProjectName}`;
      const hostName = user.displayName || 'Project Lead';

      await dbRun(
        `INSERT INTO project_meetings (id, project_id, title, room_url, host_id, host_name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [meetingId, id, `${project.name} - Official Standup`, roomUrl, userId, hostName, 'active', now, now]
      );

      meeting = {
        id: meetingId,
        project_id: id,
        title: `${project.name} - Official Standup`,
        room_url: roomUrl,
        host_id: userId,
        host_name: hostName,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
    }

    res.status(200).json({
      id: meeting.id,
      projectId: meeting.project_id,
      title: meeting.title,
      roomUrl: meeting.room_url,
      hostId: meeting.host_id,
      hostName: meeting.host_name,
      status: meeting.status,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    const parsed = updateMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Invalid meeting payload.', 'VALIDATION_ERROR');
    }

    const now = new Date().toISOString();
    if (parsed.data.title) {
      await dbRun(
        `UPDATE project_meetings SET title = ?, updated_at = ? WHERE project_id = ?`,
        [parsed.data.title, now, id]
      );
    }
    if (parsed.data.status) {
      await dbRun(
        `UPDATE project_meetings SET status = ?, updated_at = ? WHERE project_id = ?`,
        [parsed.data.status, now, id]
      );
    }

    const updated = await dbGet<DBMeetingRow>(
      `SELECT id, project_id, title, room_url, host_id, host_name, status, created_at, updated_at
       FROM project_meetings WHERE project_id = ?`,
      [id]
    );

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const joinMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const user = req.user!;
    await checkProjectAccess(id, userId);

    const parsed = joinMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message || 'Invalid join payload.', 'VALIDATION_ERROR');
    }

    const now = new Date().toISOString();
    const participantId = uuidv4();
    const displayName = user.displayName || user.email.split('@')[0] || 'Engineer';

    // Remove any previous registration for this user in this project
    await dbRun(
      `DELETE FROM meeting_participants WHERE project_id = ? AND user_id = ?`,
      [id, userId]
    );

    await dbRun(
      `INSERT INTO meeting_participants (id, project_id, user_id, display_name, peer_id, is_muted, is_video_off, is_screen_sharing, is_hand_raised, last_heartbeat, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        participantId,
        id,
        userId,
        displayName,
        parsed.data.peerId,
        parsed.data.isMuted ? 1 : 0,
        parsed.data.isVideoOff ? 1 : 0,
        parsed.data.isScreenSharing ? 1 : 0,
        now,
        now,
      ]
    );

    res.status(200).json({
      success: true,
      participantId,
      peerId: parsed.data.peerId,
      joinedAt: now,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const peerId = req.query.peerId as string | undefined;

    if (peerId) {
      await dbRun(
        `DELETE FROM meeting_participants WHERE project_id = ? AND peer_id = ?`,
        [id, peerId]
      );
      await dbRun(
        `DELETE FROM meeting_signals WHERE project_id = ? AND (from_peer_id = ? OR to_peer_id = ?)`,
        [id, peerId, peerId]
      );
    } else {
      await dbRun(
        `DELETE FROM meeting_participants WHERE project_id = ? AND user_id = ?`,
        [id, userId]
      );
    }

    res.status(200).json({ success: true, message: 'Left meeting room cleanly.' });
  } catch (error) {
    next(error);
  }
};

export const meetingHeartbeat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    const parsed = meetingHeartbeatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid heartbeat payload.', 'VALIDATION_ERROR');
    }

    const now = new Date().toISOString();
    const staleThreshold = new Date(Date.now() - 45000).toISOString();

    // Clean up stale participants older than 45 seconds
    await dbRun(
      `DELETE FROM meeting_participants WHERE project_id = ? AND last_heartbeat < ?`,
      [id, staleThreshold]
    );

    // Update current participant
    await dbRun(
      `UPDATE meeting_participants
       SET last_heartbeat = ?,
           is_muted = COALESCE(?, is_muted),
           is_video_off = COALESCE(?, is_video_off),
           is_screen_sharing = COALESCE(?, is_screen_sharing),
           is_hand_raised = COALESCE(?, is_hand_raised)
       WHERE project_id = ? AND peer_id = ?`,
      [
        now,
        parsed.data.isMuted !== undefined ? (parsed.data.isMuted ? 1 : 0) : null,
        parsed.data.isVideoOff !== undefined ? (parsed.data.isVideoOff ? 1 : 0) : null,
        parsed.data.isScreenSharing !== undefined ? (parsed.data.isScreenSharing ? 1 : 0) : null,
        parsed.data.isHandRaised !== undefined ? (parsed.data.isHandRaised ? 1 : 0) : null,
        id,
        parsed.data.peerId,
      ]
    );

    res.status(200).json({ success: true, timestamp: now });
  } catch (error) {
    next(error);
  }
};

export const getMeetingParticipants = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    const activeThreshold = new Date(Date.now() - 45000).toISOString();
    const rows = await dbAll<DBParticipantRow>(
      `SELECT id, project_id, user_id, display_name, peer_id, is_muted, is_video_off, is_screen_sharing, is_hand_raised, last_heartbeat, joined_at
       FROM meeting_participants
       WHERE project_id = ? AND last_heartbeat >= ?
       ORDER BY joined_at ASC`,
      [id, activeThreshold]
    );

    const participants = rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      userId: r.user_id,
      displayName: r.display_name,
      peerId: r.peer_id,
      isMuted: Boolean(r.is_muted),
      isVideoOff: Boolean(r.is_video_off),
      isScreenSharing: Boolean(r.is_screen_sharing),
      isHandRaised: Boolean(r.is_hand_raised),
      lastHeartbeat: r.last_heartbeat,
      joinedAt: r.joined_at,
    }));

    res.status(200).json(participants);
  } catch (error) {
    next(error);
  }
};

export const sendMeetingSignal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    await checkProjectAccess(id, userId);

    const parsed = meetingSignalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid signal payload.', 'VALIDATION_ERROR');
    }

    const signalId = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO meeting_signals (id, project_id, from_peer_id, to_peer_id, signal_type, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [signalId, id, parsed.data.fromPeerId, parsed.data.toPeerId, parsed.data.signalType, JSON.stringify(parsed.data.payload), now]
    );

    res.status(200).json({ success: true, signalId });
  } catch (error) {
    next(error);
  }
};

export const getMeetingSignals = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id || req.user!.uid;
    const peerId = req.query.peerId as string;
    await checkProjectAccess(id, userId);

    if (!peerId) {
      res.status(200).json([]);
      return;
    }

    const rows = await dbAll<DBSignalRow>(
      `SELECT id, project_id, from_peer_id, to_peer_id, signal_type, payload, created_at
       FROM meeting_signals
       WHERE project_id = ? AND to_peer_id = ?
       ORDER BY created_at ASC`,
      [id, peerId]
    );

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      await dbRun(`DELETE FROM meeting_signals WHERE id IN (${placeholders})`, ids);
    }

    const signals = rows.map((r) => {
      let parsedPayload: any = null;
      try {
        parsedPayload = JSON.parse(r.payload);
      } catch {
        parsedPayload = r.payload;
      }
      return {
        id: r.id,
        projectId: r.project_id,
        fromPeerId: r.from_peer_id,
        toPeerId: r.to_peer_id,
        signalType: r.signal_type,
        payload: parsedPayload,
        createdAt: r.created_at,
      };
    });

    res.status(200).json(signals);
  } catch (error) {
    next(error);
  }
};
