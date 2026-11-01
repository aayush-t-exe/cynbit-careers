import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[13px] leading-snug text-on-ink">
        Prototype for Cynbit&apos;s Full Stack Developer Intern assessment, not the official site.{" "}
        <Link href="/about" className="font-bold text-primary-fixed underline underline-offset-2">
          What changed and why
        </Link>
      </div>
      <header className="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/careers" className="flex items-center gap-3" aria-label="Cynbit careers home">
            <Image src="/cynbit-logo.svg" alt="Cynbit" width={97} height={40} priority className="h-9 w-auto" />
            <span className="hidden border-l border-outline-variant pl-3 font-display text-sm font-bold text-on-surface-variant sm:inline">
              Careers
            </span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link href="/careers#roles" className="hidden rounded-full px-3 py-2 hover:bg-surface-container sm:inline">
              Open roles
            </Link>
            <Link href="/careers#how" className="hidden rounded-full px-3 py-2 hover:bg-surface-container md:inline">
              How hiring works
            </Link>
            <Link href="/recruiter" className="btn btn-ghost min-h-10 px-4 text-sm">
              Recruiter view
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
