import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { serializeUser, SerializedUser } from '../utils/serialize';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokens {
  token: string;
  user: SerializedUser;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, email: string): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ userId, email }, JWT_SECRET, options);
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function registerUser(email: string, password: string): Promise<AuthTokens> {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, password_hash: passwordHash });
  const token = generateToken(user._id.toString(), email);

  return { token, user: serializeUser(user) };
}

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  user.last_login_at = new Date();
  await user.save();

  const token = generateToken(user._id.toString(), user.email);
  return { token, user: serializeUser(user) };
}

export async function getUserById(userId: string): Promise<SerializedUser | null> {
  const user = await User.findById(userId);
  return user ? serializeUser(user) : null;
}
