import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/recruiter";

export const metadata: Metadata = { title: "Hiring pipeline", robots: { index: false, follow: false } };

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[90rem] px-4 pb-20 pt-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Recruiter view</p>
          <Link href="/recruiter" className="display mt-1 block text-3xl sm:text-4xl">
            Hiring <em>pipeline</em>
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost min-h-10 px-4 text-sm">
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
