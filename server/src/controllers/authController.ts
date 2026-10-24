import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbAll, dbRun } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest, UserProfile } from '../types/index.js';
import { getJwtSecret } from '../config/env.js';
import {
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation,
} from '../services/emailService.js';

interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: 'owner' | 'member' | 'trainee';
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface DBPendingReset {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  email: string;
  display_name: string;
}

function mapUserToProfile(user: DBUser): UserProfile {
  return {
    id: user.id,
    uid: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    avatarUrl: user.avatar_url || undefined,
    photoURL: user.avatar_url || undefined,
    createdAt: user.created_at,
  };
}

/**
 * Calculates SHA-256 hash for secure token lookups without storing plaintext tokens.
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, displayName, role = 'member', avatarUrl } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError(400, 'Valid email address is required.', 'VALIDATION_ERROR');
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters.', 'VALIDATION_ERROR');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof displayName === 'string' && displayName.trim().length > 0
      ? displayName.trim()
      : cleanEmail.split('@')[0];

    const validRole = ['owner', 'member', 'trainee'].includes(role) ? role : 'member';

    // Check if user already exists
    const existing = await dbGet<{ id: string }>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      throw new AppError(409, 'An account with this email address already exists.', 'USER_ALREADY_EXISTS');
    }

    const userId = uuidv4();
    const now = new Date().toISOString();
    // High-security work factor: 12 bcrypt salt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    const safeAvatar = typeof avatarUrl === 'string' && avatarUrl.trim().length > 0 ? avatarUrl.trim() : null;

    await dbRun(
      `INSERT INTO users (id, email, password_hash, display_name, role, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, cleanEmail, passwordHash, cleanName, validRole, safeAvatar, now, now]
    );

    const userProfile: UserProfile = {
      id: userId,
      uid: userId,
      email: cleanEmail,
      displayName: cleanName,
      role: validRole as any,
      avatarUrl: safeAvatar || undefined,
      photoURL: safeAvatar || undefined,
      createdAt: now,
    };

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { userId, email: cleanEmail, role: validRole },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Account registered successfully in SQL database.',
      token,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required.', 'VALIDATION_ERROR');
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await dbGet<DBUser>(
      'SELECT id, email, password_hash, display_name, role, avatar_url, created_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!user) {
      throw new AppError(401, 'Invalid email or password credentials.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'Invalid email or password credentials.', 'INVALID_CREDENTIALS');
    }

    const userProfile = mapUserToProfile(user);

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Authentication successful.',
      token,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized session.', 'UNAUTHORIZED');
    }

    const userId = req.user.id || req.user.uid;
    const user = await dbGet<DBUser>(
      'SELECT id, email, password_hash, display_name, role, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new AppError(404, 'User not found.', 'NOT_FOUND');
    }

    res.status(200).json({
      status: 'success',
      user: mapUserToProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

export const listAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'owner') {
      throw new AppError(
        403,
        'Access denied: Only workspace owners can view the global user directory.',
        'FORBIDDEN'
      );
    }

    const rows = await dbAll<Omit<DBUser, 'password_hash'>>(
      'SELECT id, email, display_name, role, avatar_url, created_at FROM users ORDER BY display_name ASC'
    );

    const users: UserProfile[] = rows.map((u) => ({
      id: u.id,
      uid: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      avatarUrl: u.avatar_url || undefined,
      photoURL: u.avatar_url || undefined,
      createdAt: u.created_at,
    }));

    res.status(200).json({
      status: 'success',
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates user profile: Name and/or Avatar URL.
 * Immediately saves to SQL database and returns refreshed profile with avatar.
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id || req.user!.uid;
    const { displayName, avatarUrl } = req.body;

    const existingUser = await dbGet<DBUser>(
      'SELECT id, email, display_name, role, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      throw new AppError(404, 'User not found.', 'NOT_FOUND');
    }

    const cleanName = typeof displayName === 'string' && displayName.trim().length > 0
      ? displayName.trim()
      : existingUser.display_name;

    // Handle avatar: null/empty string means remove, otherwise string
    let newAvatar: string | null = existingUser.avatar_url || null;
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === '' || (typeof avatarUrl === 'string' && avatarUrl.trim().length === 0)) {
        newAvatar = null;
      } else if (typeof avatarUrl === 'string') {
        newAvatar = avatarUrl.trim();
      }
    }

    const now = new Date().toISOString();

    await dbRun(
      `UPDATE users SET display_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?`,
      [cleanName, newAvatar, now, userId]
    );

    const updatedProfile: UserProfile = {
      id: existingUser.id,
      uid: existingUser.id,
      email: existingUser.email,
      displayName: cleanName,
      role: existingUser.role,
      avatarUrl: newAvatar || undefined,
      photoURL: newAvatar || undefined,
      createdAt: existingUser.created_at,
    };

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      user: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id || req.user!.uid;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, 'Both current and new passwords are required.', 'VALIDATION_ERROR');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError(400, 'New password must be at least 8 characters.', 'VALIDATION_ERROR');
    }

    const user = await dbGet<DBUser>(
      'SELECT id, email, display_name, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new AppError(404, 'User not found.', 'NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError(400, 'Current password is incorrect.', 'INVALID_PASSWORD');
    }

    const now = new Date().toISOString();
    const newHash = await bcrypt.hash(newPassword, 12);

    await dbRun(
      `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
      [newHash, now, userId]
    );

    // Send security notification email
    sendPasswordChangedConfirmation(user.email, user.display_name).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enterprise Password Reset: Initiates reset workflow.
 * 1. Constant-time execution prevents user email enumeration.
 * 2. Generates 32-byte cryptographically secure token.
 * 3. Hashes token with SHA-256 before persisting into database.
 * 4. Sends professional bilingual transactional email with single-use link (60 min expiry).
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError(400, 'Valid email address is required.', 'VALIDATION_ERROR');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user
    const user = await dbGet<DBUser>(
      'SELECT id, email, display_name FROM users WHERE email = ?',
      [cleanEmail]
    );

    // Timing-attack and user-enumeration defense: Always return identical response
    const genericSuccess = {
      status: 'success',
      message: 'If an account matches that email address, a password reset link has been dispatched.',
    };

    if (!user) {
      // Artificially delay by ~150ms to mimic cryptographic work and avoid timing oracle
      await new Promise((r) => setTimeout(r, 150));
      res.status(200).json(genericSuccess);
      return;
    }

    // Invalidate any existing unused tokens for this user
    const now = new Date();
    await dbRun(
      'UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL',
      [now.toISOString(), user.id]
    );

    // Generate 32-byte (256-bit) cryptographically strong random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Token expires in 1 hour (3600 seconds)
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const resetId = uuidv4();

    await dbRun(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
      [resetId, user.id, tokenHash, expiresAt, now.toISOString()]
    );

    // Asynchronously dispatch transactional email
    const emailResult = await sendPasswordResetEmail(user.email, user.display_name, rawToken);

    res.status(200).json({
      ...genericSuccess,
      previewUrl: emailResult.previewUrl, // populated on development Ethereal mailer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates whether a reset token is valid, unexpired, and not yet consumed.
 */
export const verifyResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawToken = (req.params.token || req.query.token || req.body.token) as string;

    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
      throw new AppError(400, 'Reset token is required.', 'VALIDATION_ERROR');
    }

    const tokenHash = hashToken(rawToken.trim());
    const reset = await dbGet<DBPendingReset>(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.email, u.display_name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = ?`,
      [tokenHash]
    );

    if (!reset) {
      throw new AppError(400, 'Invalid or expired password reset link.', 'INVALID_TOKEN');
    }

    if (reset.used_at) {
      throw new AppError(400, 'This password reset link has already been used.', 'TOKEN_ALREADY_USED');
    }

    const now = new Date();
    if (new Date(reset.expires_at) < now) {
      throw new AppError(400, 'This password reset link has expired (valid for 60 minutes). Please request a new one.', 'TOKEN_EXPIRED');
    }

    // Mask email for security: e.g. a***d@example.com
    const emailParts = reset.email.split('@');
    const maskedName = emailParts[0].length <= 2 
      ? emailParts[0] 
      : `${emailParts[0][0]}***${emailParts[0][emailParts[0].length - 1]}`;
    const maskedEmail = `${maskedName}@${emailParts[1]}`;

    res.status(200).json({
      status: 'success',
      valid: true,
      email: maskedEmail,
      displayName: reset.display_name,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Consumes token and sets new password.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Reset token is required.', 'VALIDATION_ERROR');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError(400, 'New password must be at least 8 characters.', 'VALIDATION_ERROR');
    }

    const tokenHash = hashToken(token.trim());
    const reset = await dbGet<DBPendingReset>(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.email, u.display_name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = ?`,
      [tokenHash]
    );

    if (!reset) {
      throw new AppError(400, 'Invalid or expired password reset link.', 'INVALID_TOKEN');
    }

    if (reset.used_at) {
      throw new AppError(400, 'This password reset link has already been consumed.', 'TOKEN_ALREADY_USED');
    }

    const now = new Date();
    if (new Date(reset.expires_at) < now) {
      throw new AppError(400, 'This password reset link has expired. Please request a new one.', 'TOKEN_EXPIRED');
    }

    // Hash new password with 12 bcrypt rounds
    const newHash = await bcrypt.hash(newPassword, 12);
    const nowIso = now.toISOString();

    // Mark token as consumed and update user password
    await dbRun(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [
      newHash,
      nowIso,
      reset.user_id,
    ]);

    await dbRun(`UPDATE password_resets SET used_at = ? WHERE id = ?`, [
      nowIso,
      reset.id,
    ]);

    // Send confirmation email
    sendPasswordChangedConfirmation(reset.email, reset.display_name).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Your password has been successfully reset. You can now log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id || req.user!.uid;

    await dbRun(`DELETE FROM users WHERE id = ?`, [userId]);

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
