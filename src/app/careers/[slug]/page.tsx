import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Check, Clock, IndianRupee, MapPin, Users } from "lucide-react";
import { getRole, roles } from "@/data/roles";
import { ApplyForm } from "@/components/apply-form";
import { jobPostingJsonLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return roles.map((role) => ({ slug: role.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const role = getRole((await params).slug);
  if (!role) return {};
  const kind = role.type === "internship" ? "Internship" : "Full-time";
  const description = `${role.summary} ${kind} at Cynbit Technologies, ${role.location}. Apply in about a minute with your résumé.`;
  return {
    title: role.title,
    description,
    alternates: { canonical: `/careers/${role.slug}` },
    openGraph: { title: `${role.title} at Cynbit`, description, type: "website", url: `/careers/${role.slug}` },
    twitter: { card: "summary_large_image", title: `${role.title} at Cynbit`, description },
  };
}

export default async function RolePage({ params }: Props) {
  const role = getRole((await params).slug);
  if (!role) notFound();
  const isInternship = role.type === "internship";

  const facts = [
    { icon: Briefcase, label: "Type", value: isInternship ? "Internship" : "Full-time" },
    { icon: Users, label: "Team", value: role.team },
    { icon: MapPin, label: "Location", value: role.location },
    ...(role.experience ? [{ icon: Clock, label: "Experience", value: role.experience }] : []),
    { icon: IndianRupee, label: isInternship ? "Stipend" : "Salary", value: "Not listed yet" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(role)).replace(/</g, "\\u003c") }} />

      <div className="border-b border-outline-variant/40 bg-gradient-to-b from-primary-fixed/25 to-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
          <Link href="/careers#roles" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
            <ArrowLeft size={16} aria-hidden /> All roles
          </Link>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`chip ${isInternship ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-primary-fixed/60 text-primary"}`}>
              {isInternship ? "Internship" : "Full-time"}
            </span>
            <span className="chip bg-white text-on-surface-variant">{role.team}</span>
          </div>
          <h1 className="display mt-4 max-w-3xl text-4xl sm:text-6xl">{role.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">{role.summary}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 rounded-3xl bg-white/70 p-4 text-sm sm:grid-cols-4 lg:hidden">
            {facts.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-outline">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <a href="#apply" className="btn btn-primary mt-6 lg:hidden">
            Apply in about a minute
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-12">
          <article className="space-y-10">
            <Section title="What you'll do" items={role.responsibilities} />
            <Section title="What we're looking for" items={role.requirements} />
            <div>
              <h2 className="font-display text-2xl font-bold">What you get</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {role.benefits.map((benefit) => (
                  <li key={benefit} className="chip bg-surface-container px-4 py-2 text-sm text-on-surface">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <section id="apply" className="card scroll-mt-24 p-5 sm:p-8">
            <p className="eyebrow text-primary">Apply</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">
              Apply in about a <em>minute.</em>
            </h2>
            <p className="mt-3 text-on-surface-variant">
              Five things are required: your résumé, name, email, phone and consent. Everything else is optional.
            </p>
            <p className="mt-4 rounded-2xl bg-tertiary-fixed px-4 py-3 text-sm font-semibold text-on-tertiary-fixed">
              This is a prototype: applications sent here don&apos;t reach Cynbit. Please use a test résumé, not your real one.
            </p>
            <div className="mt-8">
              <ApplyForm roleSlug={role.slug} roleTitle={role.title} isInternship={isInternship} />
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-6">
            <dl className="space-y-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="relative pl-8">
                  <Icon size={18} className="absolute left-0 top-0.5 text-primary" aria-hidden />
                  <dt className="text-xs font-bold uppercase tracking-wider text-outline">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <a href="#apply" className="btn btn-primary mt-6 w-full">
              Apply in about a minute
            </a>
            <p className="mt-3 text-center text-xs text-outline">Cynbit aims to review applications within 48 hours.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed text-on-surface-variant">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-fixed/50 text-primary">
              <Check size={14} aria-hidden />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
