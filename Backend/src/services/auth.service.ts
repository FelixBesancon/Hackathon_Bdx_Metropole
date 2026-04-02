import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authRepo from "../repositories/auth.repository";
import type { RegisterPayload, LoginPayload, JwtPayload } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

export async function register(payload: RegisterPayload) {
  const existing = await authRepo.findByEmail(payload.email);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await authRepo.createUser({
    email: payload.email,
    password: hashedPassword,
    name: payload.name,
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function login(payload: LoginPayload) {
  const user = await authRepo.findByEmail(payload.email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatch = await bcrypt.compare(payload.password, user.password);
  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = signToken({ userId: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
