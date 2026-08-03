import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { IconLayoutDashboard } from "@/components/shared/icons";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-card">
            <IconLayoutDashboard className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground">
            لوحة تحكم دليل الصنايعية
          </h1>
          <p className="mt-2 text-base text-muted">
            سجّل دخولك لإدارة الصنايعية والطلبات والتخصصات.
          </p>
        </div>

        <AdminLoginForm />

        <p className="mt-6 text-center text-base text-muted">
          <Link
            href="/"
            className="font-bold text-accent transition-colors hover:text-accent/80"
          >
            العودة للموقع
          </Link>
        </p>
      </div>
    </main>
  );
}
