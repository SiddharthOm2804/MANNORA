import { createHash, timingSafeEqual } from 'node:crypto';
import { AuthSession } from '../models/AuthSession.js';
import { User } from '../models/User.js';
import { World } from '../models/World.js';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const cookieValue = (header = '', name) => {
  const entry = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : '';
};
const safeEqual = (left, right) => {
  const a = Buffer.from(String(left)); const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
};

export const authenticate = async (req, res, next) => {
  try {
    const token = cookieValue(req.headers.cookie, 'mannora_session');
    if (!token || token.length > 200) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    const session = await AuthSession.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } }).lean();
    if (!session) return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    const user = await User.findById(session.userId).select('_id email displayName').lean();
    if (!user) return res.status(401).json({ success: false, message: 'Account is unavailable.' });
    req.user = user;
    req.authSession = session;
    return next();
  } catch (error) { return next(error); }
};

export const requireCsrf = (req, res, next) => {
  const csrfCookie = cookieValue(req.headers.cookie, 'mannora_csrf');
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader) || !safeEqual(hash(csrfCookie), req.authSession?.csrfHash || '')) {
    return res.status(403).json({ success: false, message: 'Security token is missing or expired. Refresh and try again.' });
  }
  return next();
};

export const authorizeWorld = async (req, res, next, id) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ success: false, message: 'Invalid world identifier.' });
    const world = await World.findOne({ _id: id, $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }] }).lean();
    if (!world) return res.status(404).json({ success: false, message: 'World not found.' });
    const owner = String(world.ownerId) === String(req.user._id);
    const membership = world.members?.find((item) => String(item.userId) === String(req.user._id));
    const role = owner ? 'owner' : membership?.role;
    const write = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    if (write && role !== 'owner' && role !== 'editor') return res.status(403).json({ success: false, message: 'You have view-only access to this world.' });
    if (req.method === 'DELETE' && role !== 'owner') return res.status(403).json({ success: false, message: 'Only the world owner can delete it.' });
    req.world = world;
    req.worldRole = role;
    return next();
  } catch (error) { return next(error); }
};

export const requireWorldAccess = (req, res, next) => authorizeWorld(req, res, next, req.params.id);

export const requireWorldAccessForBody = async (req, res, next) => {
  const id = req.body?.worldId;
  if (typeof id !== 'string') return res.status(400).json({ success: false, message: 'A worldId is required.' });
  return authorizeWorld(req, res, next, id);
};

export const authenticateSocketWorld = async (req, worldId) => {
  const token = cookieValue(req.headers.cookie, 'mannora_session');
  if (!token || token.length > 200 || !/^[a-f\d]{24}$/i.test(worldId || '')) return null;
  const session = await AuthSession.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const world = await World.findOne({ _id: worldId, $or: [{ ownerId: session.userId }, { 'members.userId': session.userId }] }).select('_id').lean();
  return world ? { userId: String(session.userId), expiresAt: session.expiresAt } : null;
};

export const hashSecret = hash;
