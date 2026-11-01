import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant/50 bg-surface-container-low">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-on-surface-variant sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-display text-base font-bold text-on-surface">Cynbit Technologies</p>
          <p className="max-w-sm leading-relaxed">
            32/115 Pratap Nagar, Jaipur, Rajasthan 302033.
            <br />
            Hiring questions: <a className="font-semibold text-primary underline-offset-2 hover:underline" href="mailto:opportunities@cynbit.in">opportunities@cynbit.in</a>
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-display font-bold text-on-surface">This prototype</p>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-primary" href="/careers">Open roles</Link></li>
            <li><Link className="hover:text-primary" href="/about">What changed and why</Link></li>
            <li><Link className="hover:text-primary" href="/recruiter">Recruiter view</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-display font-bold text-on-surface">The real site</p>
          <ul className="space-y-1.5">
            <li><a className="hover:text-primary" href="https://www.cynbit.in/careers">cynbit.in/careers</a></li>
            <li><a className="hover:text-primary" href="https://www.cynbit.in/privacy">Privacy policy</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-outline sm:px-6">
        Built by Aayush Thakur as a working prototype. Role descriptions are copied from cynbit.in/careers on 1 Nov 2026.
      </p>
    </footer>
  );
}
