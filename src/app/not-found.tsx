import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-6xl place-items-center px-4 py-20 text-center">
      <div>
        <p className="eyebrow text-primary">404</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">
          This page isn&apos;t <em>hiring.</em>
        </h1>
        <p className="mt-4 text-on-surface-variant">The link may be old, or the role may have closed.</p>
        <Link href="/careers" className="btn btn-primary mt-8">
          See open roles
        </Link>
      </div>
    </div>
  );
}
