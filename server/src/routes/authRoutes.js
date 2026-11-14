import { Router } from 'express';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { User } from '../models/User.js';
import { AuthSession } from '../models/AuthSession.js';
import { authenticate, hashSecret, requireCsrf } from '../middleware/authMiddleware.js';
import { ENV } from '../config/env.js';
import { World } from '../models/World.js';
import { eventPublisher } from '../services/eventPublisher.js';

const router = Router();
const scrypt = promisify(scryptCallback);
const COOKIE_OPTIONS = { httpOnly: true, secure: ENV.IS_PRODUCTION, sameSite: ENV.COOKIE_SAME_SITE.toLowerCase(), path: '/' };
const passwordHash = async (password, salt = randomBytes(16).toString('hex')) => {
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
};
const passwordMatches = async (password, encoded) => {
  const [salt, stored] = encoded.split(':');
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(stored, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const dummyPasswordHash = await passwordHash('not-a-real-account-password');
const issueSession = async (user, res) => {
  const token = randomBytes(32).toString('base64url');
  const csrf = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await AuthSession.create({ userId: user._id, tokenHash: hashSecret(token), csrfHash: hashSecret(csrf), expiresAt });
  res.cookie('mannora_session', token, { ...COOKIE_OPTIONS, expires: expiresAt });
  res.cookie('mannora_csrf', csrf, { ...COOKIE_OPTIONS, httpOnly: false, expires: expiresAt });
};
const publicUser = (user) => ({ id: String(user._id), email: user.email, displayName: user.displayName });

router.post('/register', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
    const password = req.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || displayName.length < 2 || displayName.length > 80 || typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Enter a valid email, a name, and a password of 12 to 128 characters.' });
    }
    const user = await User.create({ email, displayName, passwordHash: await passwordHash(password) });
    await issueSession(user, res);
    return res.status(201).json({ success: true, data: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    const matches = password.length <= 128 && await passwordMatches(password, user?.passwordHash || dummyPasswordHash);
    if (!user || !matches) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    await issueSession(user, res);
    return res.json({ success: true, data: publicUser(user) });
  } catch (error) { return next(error); }
});

router.get('/me', authenticate, (req, res) => res.json({ success: true, data: publicUser(req.user) }));
router.post('/logout', authenticate, requireCsrf, async (req, res, next) => {
  try {
    await AuthSession.deleteOne({ _id: req.authSession._id });
    const worlds = await World.find({ $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }] }).select('_id').lean();
    for (const world of worlds) eventPublisher.publish(String(world._id), { type: 'ACCESS_REVOKED', payload: { userId: String(req.user._id) } });
    res.clearCookie('mannora_session', COOKIE_OPTIONS);
    res.clearCookie('mannora_csrf', { ...COOKIE_OPTIONS, httpOnly: false });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

export default router;
