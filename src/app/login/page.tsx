import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { auth, signInWithCredentials } from "@/lib/auth";
import { FormState } from "@/types/form-state";

async function loginAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  const emailRaw = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!emailRaw || !password) {
    return {
      status: "error",
      message: "กรุณากรอกอีเมลและรหัสผ่าน",
    };
  }

  const email = emailRaw.toLowerCase();

  const result = await signInWithCredentials(email, password);

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
    };
  }

  redirect("/");
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">
            เข้าสู่ระบบ
          </h1>
          <p className="text-sm text-zinc-600">
            เข้าถึงระบบบันทึกการออมเงินของคุณ
          </p>
        </div>
        <LoginForm action={loginAction} />
        <p className="text-center text-xs text-zinc-500">
          กลับหน้าหลัก{" "}
          <Link href="/" className="font-medium text-blue-600 hover:underline">
            ระบบบันทึกการออมเงิน
          </Link>
        </p>
      </div>
    </div>
  );
}
