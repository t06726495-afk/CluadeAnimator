import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-black tracking-tight">
            <span className="text-primary">Diamond</span>
            <span>Plan</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Practice plans built for the field.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
