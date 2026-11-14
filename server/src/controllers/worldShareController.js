import { User } from '../models/User.js';
import { World } from '../models/World.js';
import { eventPublisher } from '../services/eventPublisher.js';

const requireOwner = (req, res) => {
  if (req.worldRole === 'owner') return true;
  res.status(403).json({ success: false, message: 'Only the world owner can manage sharing.' });
  return false;
};

export const shareWorld = async (req, res, next) => {
  try {
    if (!requireOwner(req, res)) return;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body?.role === 'editor' ? 'editor' : 'viewer';
    if (!email || email.length > 254) return res.status(400).json({ success: false, message: 'Enter a valid account email.' });
    const user = await User.findOne({ email }).select('_id email displayName').lean();
    if (!user) return res.status(404).json({ success: false, message: 'No MANNORA account exists for that email.' });
    if (String(user._id) === String(req.user._id)) return res.status(400).json({ success: false, message: 'The world owner already has full access.' });
    await World.updateOne({ _id: req.params.id, ownerId: req.user._id }, { $pull: { members: { userId: user._id } } });
    await World.updateOne({ _id: req.params.id, ownerId: req.user._id }, { $push: { members: { userId: user._id, role } } });
    return res.json({ success: true, data: { email: user.email, displayName: user.displayName, role } });
  } catch (error) { return next(error); }
};

export const revokeWorldShare = async (req, res, next) => {
  try {
    if (!requireOwner(req, res)) return;
    if (!/^[a-f\d]{24}$/i.test(req.params.userId)) return res.status(400).json({ success: false, message: 'Invalid account identifier.' });
    const result = await World.updateOne({ _id: req.params.id, ownerId: req.user._id }, { $pull: { members: { userId: req.params.userId } } });
    if (!result.modifiedCount) return res.status(404).json({ success: false, message: 'Sharing permission was not found.' });
    eventPublisher.publish(req.params.id, { type: 'ACCESS_REVOKED', payload: { userId: req.params.userId } });
    return res.json({ success: true });
  } catch (error) { return next(error); }
};
