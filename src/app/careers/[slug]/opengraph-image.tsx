import { ImageResponse } from "next/og";
import { getRole, roles } from "@/data/roles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Open role at Cynbit Technologies";

export function generateStaticParams() {
  return roles.map((role) => ({ slug: role.slug }));
}

// A real PNG per role: the live site shares an SVG logo, which LinkedIn and WhatsApp don't show.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const role = getRole((await params).slug);
  const title = role?.title ?? "Careers at Cynbit";
  const kind = role?.type === "internship" ? "Internship" : "Full-time";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#e3f6f7",
          background: "radial-gradient(circle at 80% 30%, #007b83 0%, #04464b 45%, #032f33 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#96f1fa" }} />
          Cynbit Technologies · Careers
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 14, fontSize: 28 }}>
            <span style={{ background: "#ffddb3", color: "#774e00", padding: "8px 22px", borderRadius: 999, fontWeight: 700 }}>{kind}</span>
            <span style={{ background: "rgba(227,246,247,0.12)", padding: "8px 22px", borderRadius: 999 }}>{role?.location ?? "Remote / Jaipur"}</span>
          </div>
          <div style={{ fontSize: title.length > 28 ? 76 : 92, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{title}</div>
        </div>
        <div style={{ fontSize: 30, color: "#7ad5dd" }}>Apply in about a minute with your résumé</div>
      </div>
    ),
    size,
  );
}
