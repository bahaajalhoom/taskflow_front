import { Router } from 'express';
import {
  register,
  login,
  getMe,
  listAllUsers,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  registrationRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  resetRegistrationRateLimits,
} from '../middlewares/security.js';

const router = Router();

router.post('/register', registrationRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, listAllUsers);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

// Enterprise Password Reset Endpoints
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.get('/forgot-password', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/forgot-password');
  }
  return res.json({
    status: 'active',
    endpoint: '/api/auth/forgot-password',
    method: 'POST',
    description: 'Enterprise Password Reset Dispatcher. Send a POST request with { "email": "user@example.com" } to dispatch an official reset link.',
    webPage: '/forgot-password',
  });
});
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);
router.get('/reset-password', (req, res) => {
  const token = req.query.token;
  if (token) {
    return res.redirect(`/reset-password?token=${encodeURIComponent(String(token))}`);
  }
  return res.redirect('/forgot-password');
});

if (process.env.NODE_ENV !== 'production') {
  router.post('/reset-limiter', (_req, res) => {
    resetRegistrationRateLimits();
    res.json({ ok: true, message: 'Registration rate limiters reset.' });
  });
}

export default router;
