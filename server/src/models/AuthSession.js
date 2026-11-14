import mongoose from 'mongoose';

const AuthSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  csrfHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export const AuthSession = mongoose.models.AuthSession || mongoose.model('AuthSession', AuthSessionSchema);
export default AuthSession;
