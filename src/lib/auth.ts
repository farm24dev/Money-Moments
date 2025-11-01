import { compare } from "bcryptjs";
import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "app_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 วัน

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthSession = {
  user: SessionUser;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable is required for authentication.",
    );
  }

  return secret;
}

function hashToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(token).digest("hex");
}

async function createSession(userId: string) {
  const token: string = randomBytes(32).toString("hex");
  const tokenHash: string = hashToken(token);
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      expires,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function auth(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (session.expires < new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    user: session.user,
  };
}

export async function signInWithCredentials(
  email: string,
  password: string,
) {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return {
      success: false as const,
      message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  const passwordValid = await compare(password, user.passwordHash);

  if (!passwordValid) {
    return {
      success: false as const,
      message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  await createSession(user.id);

  return {
    success: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function establishSessionForUser(userId: string) {
  await createSession(userId);
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);

  await prisma.session
    .delete({
      where: { tokenHash },
    })
    .catch(() => { });

  cookieStore.delete(SESSION_COOKIE_NAME);
}
