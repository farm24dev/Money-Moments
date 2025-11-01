import { AppMobileNav } from "./AppMobileNav";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <AppSidebar />
      <div className="flex w-full flex-1 flex-col">
        <div className="sticky top-0 z-20 border-b border-border/50 bg-background/90 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">ระบบบันทึกการออมเงิน</p>
              <p className="text-xs text-muted-foreground">
                จัดการยอดออม สรุปสถิติ และติดตามหมวดหมู่ได้สะดวก
              </p>
            </div>
            <AppMobileNav />
          </div>
        </div>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
