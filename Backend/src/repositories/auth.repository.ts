import { prisma } from "../config/database";

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: { email: string; password: string; name: string }) {
  return prisma.user.create({ data });
}
