import type { Stage } from "@/lib/db/schema";

export const stageInfo: Record<Stage, { label: string; candidate: string; tone: "neutral" | "active" | "good" | "closed" }> = {
  applied: {
    label: "Applied",
    candidate: "We have your application and résumé. Cynbit aims to review every application within 48 hours.",
    tone: "neutral",
  },
  in_review: {
    label: "In review",
    candidate: "Someone on the team is reading your application now.",
    tone: "active",
  },
  shortlisted: {
    label: "Shortlisted",
    candidate: "You're on the shortlist. Expect a message about next steps on email or WhatsApp.",
    tone: "active",
  },
  interview: {
    label: "Interview",
    candidate: "You're in the interview stage. Check your email for the invite and details.",
    tone: "active",
  },
  offer: {
    label: "Offer",
    candidate: "Good news: there's an offer for you. The team will share the details directly.",
    tone: "good",
  },
  not_selected: {
    label: "Not selected",
    candidate: "The team has decided not to move forward this time. Thank you for applying; you're welcome to apply for other roles.",
    tone: "closed",
  },
};

// The candidate-facing path. "Not selected" can follow any stage.
export const pipeline: Stage[] = ["applied", "in_review", "shortlisted", "interview", "offer"];
