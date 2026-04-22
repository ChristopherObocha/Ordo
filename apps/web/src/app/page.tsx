"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

const C = { bg: "var(--ordo-bg)", text: "var(--ordo-text)", muted: "var(--ordo-muted)" };
const SANS = "var(--font-dm-sans), sans-serif";

export default function Home() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const parish = useQuery(api.parishes.getMyParish);

  useEffect(() => {
    if (user === undefined || parish === undefined) return;

    if (user === null) {
      router.replace("/signin");
      return;
    }

    const phase = user.onboardingPhase;

    if (!parish || phase !== "complete") {
      if (phase === "import" || phase === "generate") {
        router.replace(`/onboarding?phase=${phase}`);
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    router.replace("/dashboard/rota");
  }, [user, parish, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: C.bg,
        fontFamily: SANS,
      }}
    >
      <p style={{ color: C.muted, fontSize: "0.95rem" }}>Loading…</p>
    </div>
  );
}
