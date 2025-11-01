import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { RegisterForm } from "./register-form";
import { auth, establishSessionForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormState } from "@/types/form-state";

async function registerAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  const nameRaw = formData.get("name")?.toString().trim() ?? "";
  const emailRaw = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword =
    formData.get("confirmPassword")?.toString() ?? "";

  if (!emailRaw || !password || !confirmPassword) {
    return {
      status: "error",
      message: "กรุณากรอกข้อมูลให้ครบถ้วน",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "รหัสผ่านไม่ตรงกัน",
    };
  }

  if (password.length < 6) {
    return {
      status: "error",
      message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    };
  }

  const email = emailRaw.toLowerCase();
  const name = nameRaw.length > 0 ? nameRaw : null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "อีเมลนี้ถูกใช้งานแล้ว",
    };
  }

  const passwordHash = await hash(password, 12);

  let userId: string;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
      },
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "อีเมลนี้ถูกใช้งานแล้ว",
      };
    }

    console.error("Failed to register user", error);

    return {
      status: "error",
      message: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง",
    };
  }

  await establishSessionForUser(userId);

  redirect("/");
}

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">
            สมัครสมาชิกใหม่
          </h1>
          <p className="text-sm text-zinc-600">
            สร้างบัญชีเพื่อเริ่มจัดการข้อมูลการออมของคุณ
          </p>
        </div>
        <RegisterForm action={registerAction} />
      </div>
    </div>
  );
}
