"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../../convex/_generated/dataModel";

import { OnboardingLayout } from "./_components/OnboardingLayout";
import { PhaseProgress } from "./_components/PhaseProgress";
import { StepPersonalInfo } from "./_components/StepPersonalInfo";
import { StepParishInfo } from "./_components/StepParishInfo";
import { StepChurches } from "./_components/StepChurches";
import { StepClergy } from "./_components/StepClergy";
import { StepImportChoice } from "./_components/StepImportChoice";
import { StepICalImport } from "./_components/StepICalImport";
import { StepManualActivities } from "./_components/StepManualActivities";
import { StepEventMapping } from "./_components/StepEventMapping";
import { StepRules } from "./_components/StepRules";
import { StepPreviewRota } from "./_components/StepPreviewRota";
import { StepFinalize } from "./_components/StepFinalize";
import type { Slot } from "./_components/MonthlyRotaGrid";
import { C, SANS } from "./_components/shared";

// ─── Types ────────────────────────────────────────────────────────────────────
type ClergyType = "bishop" | "priest" | "deacon" | "religious" | "sister";
type MembershipRole = "parish_priest" | "administrator";
type RangeKey = "1m" | "3m" | "6m" | "eoy";

type ParsedEvent = {
  uid: string;
  title: string;
  dtstart: string;
  time: string;
  isRecurring: boolean;
  rrule?: string;
  suggestedType: string;
  suggestedSchedule: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeRange(range: RangeKey): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = isoDate(now);
  const end = new Date(now);
  switch (range) {
    case "1m": end.setMonth(end.getMonth() + 1); break;
    case "3m": end.setMonth(end.getMonth() + 3); break;
    case "6m": end.setMonth(end.getMonth() + 6); break;
    case "eoy": return { startDate, endDate: `${now.getFullYear()}-12-31` };
  }
  return { startDate, endDate: isoDate(end) };
}

// ─── Phase step labels ────────────────────────────────────────────────────────
const PHASE0_STEPS = ["You", "Parish", "Churches", "Clergy"];
const PHASE2_STEPS = ["Rules", "Preview", "Finalise"];

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Convex hooks
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProgress = useMutation(api.users.updateOnboardingProgress);
  const generateRota = useAction(api.rotaGeneration.generateRota);
  const addSelfClergy = useMutation(api.clergy.addSelf);

  // ─── Master state ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<number>(0);   // 0=setup, 1=import, 2=generate
  const [step, setStep]   = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  // Personal
  const [name, setName] = useState("");
  const [membershipRole, setMembershipRole] = useState<MembershipRole>("parish_priest");
  const [clergyType, setClergyType] = useState<ClergyType>("priest");

  // Parish
  const [parishId, setParishId] = useState<string | null>(null);
  const [mainChurchId, setMainChurchId] = useState<string | null>(null);
  const [mainChurchName, setMainChurchName] = useState<string>("");

  // Import
  const [importMethod, setImportMethod] = useState<"ical" | "manual" | null>(null);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);

  // Generation
  const [rotaId, setRotaId] = useState<string | null>(null);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [rotaSlots, setRotaSlots] = useState<Slot[]>([]);
  const [rotaRange, setRotaRange] = useState<RangeKey>("3m");
  const [generating, setGenerating] = useState(false);

  // ─── Resume from user/URL on mount ──────────────────────────────────────────
  useEffect(() => {
    if (hydrated) return;
    if (currentUser === undefined) return;  // still loading

    // URL param override takes precedence
    const urlPhase = searchParams?.get("phase");
    if (urlPhase === "import") {
      setPhase(1);
      setStep(0);
      setHydrated(true);
      return;
    }
    if (urlPhase === "generate") {
      setPhase(2);
      setStep(0);
      setHydrated(true);
      return;
    }

    if (currentUser?.onboardingPhase) {
      switch (currentUser.onboardingPhase) {
        case "complete":
          router.replace("/dashboard/rota");
          return;
        case "setup":
          setPhase(0);
          setStep(currentUser.onboardingStep ?? 0);
          break;
        case "import":
          setPhase(1);
          setStep(0);
          break;
        case "generate":
          setPhase(2);
          setStep(0);
          break;
      }
    }

    // Seed name if user already has one
    if (currentUser?.name) setName(currentUser.name);

    setHydrated(true);
  }, [currentUser, searchParams, hydrated, router]);

  // ─── Restore parishId from DB on load (handles refresh mid-onboarding) ──────
  const myParish = useQuery(api.parishes.getMyParish);
  useEffect(() => {
    if (myParish && !parishId) {
      setParishId(myParish._id as unknown as string);
    }
  }, [myParish, parishId]);

  // ─── Load main church id once parishId is known (for activities steps) ──────
  const mainChurch = useQuery(
    api.churches.getMain,
    parishId ? { parishId: parishId as Id<"parishes"> } : "skip",
  );
  useEffect(() => {
    if (mainChurch && mainChurch._id) {
      setMainChurchId(mainChurch._id as unknown as string);
      if (!mainChurchName) setMainChurchName(mainChurch.name ?? "");
    }
  }, [mainChurch, mainChurchName]);

  // ─── Slot hydration after rota is generated ─────────────────────────────────
  const assignments = useQuery(
    api.assignments.listForRota,
    rotaId ? { rotaId: rotaId as Id<"rotas"> } : "skip",
  );
  const activitiesList = useQuery(
    api.activities.list,
    parishId ? { parishId: parishId as Id<"parishes"> } : "skip",
  );
  const clergyList = useQuery(
    api.clergy.list,
    parishId ? { parishId: parishId as Id<"parishes"> } : "skip",
  );

  useEffect(() => {
    if (!assignments || !activitiesList || !clergyList) return;
    const actById = new Map<string, (typeof activitiesList)[number]>();
    for (const a of activitiesList) actById.set(a._id as unknown as string, a);
    const clergyById = new Map<string, (typeof clergyList)[number]>();
    for (const c of clergyList) clergyById.set(c._id as unknown as string, c);

    const hydrated: Slot[] = (assignments as Doc<"assignments">[]).map((asn) => {
      const act = actById.get(asn.activityId as unknown as string);
      const cl  = clergyById.get(asn.clergyId as unknown as string);
      return {
        date:         asn.date,
        activityId:   asn.activityId as unknown as string,
        activityName: act?.name ?? "Activity",
        activityType: act?.type ?? "other",
        time:         act?.time ?? "",
        clergyName:   cl?.name,
        clergyType:   cl?.type,
        hasViolation: asn.hasViolation ?? false,
      };
    });
    setRotaSlots(hydrated);
  }, [assignments, activitiesList, clergyList]);

  // ─── Navigation helpers ─────────────────────────────────────────────────────
  async function persistProgress(
    nextPhase: "setup" | "import" | "generate" | "complete",
    nextStep: number,
  ) {
    try {
      await updateProgress({ phase: nextPhase, step: nextStep });
    } catch {
      // ignore — progress persistence should not block flow
    }
  }

  function goToPhase(nextPhase: number, nextStep: number = 0) {
    setPhase(nextPhase);
    setStep(nextStep);
    const phaseKey = (["setup", "import", "generate"] as const)[nextPhase];
    void persistProgress(phaseKey, nextStep);
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    const phaseKey = (["setup", "import", "generate"] as const)[phase];
    void persistProgress(phaseKey, nextStep);
  }

  // ─── Rota generation trigger ────────────────────────────────────────────────
  async function runGeneration(range: RangeKey) {
    if (!parishId) return;
    setGenerating(true);
    setRotaSlots([]);
    try {
      const { startDate, endDate } = computeRange(range);
      const result = await generateRota({
        parishId: parishId as Id<"parishes">,
        startDate,
        endDate,
      });
      setRotaId(result.rotaId as unknown as string);
      setAssignedCount(result.assignedCount);
      setViolationCount(result.violationSlots.length);
    } finally {
      setGenerating(false);
    }
  }

  // ─── Finalise / go-to-rota ──────────────────────────────────────────────────
  async function handleDone() {
    try {
      if (parishId) {
        await addSelfClergy({
          parishId: parishId as Id<"parishes">,
          type: clergyType,
          roles: [],
        });
      }
    } catch {
      // addSelf is idempotent-ish; ignore errors so we don't block
    }
    await persistProgress("complete", 0);
    router.replace("/dashboard/rota");
  }

  // ─── Phase progress labels ──────────────────────────────────────────────────
  const phaseSteps = useMemo(() => {
    if (phase === 0) return PHASE0_STEPS;
    if (phase === 1) {
      if (importMethod === "manual") return ["Import", "Add services"];
      return ["Import", "Map"];
    }
    return PHASE2_STEPS;
  }, [phase, importMethod]);

  // Translate internal step index into PhaseProgress currentStep
  const visibleStep = useMemo(() => {
    if (phase === 1) {
      // phase 1 internal steps: 0 = choice, 1 = ical/manual, 2 = mapping (iCal only)
      if (step === 0) return 0;
      return 1;
    }
    return step;
  }, [phase, step]);

  // ─── Render guards ──────────────────────────────────────────────────────────
  if (!hydrated || currentUser === undefined) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: C.bg, fontFamily: SANS,
        color: C.muted, fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  if (currentUser === null) {
    // Not authenticated — hand off to login
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  // ─── Step rendering ─────────────────────────────────────────────────────────
  const stepKey = `${phase}-${step}`;

  let content: React.ReactNode = null;

  if (phase === 0) {
    // SETUP PHASE
    if (step === 0) {
      content = (
        <StepPersonalInfo
          key={stepKey}
          onNext={(data) => {
            setName(data.name);
            setMembershipRole(data.membershipRole);
            setClergyType(data.clergyType);
            goToStep(1);
          }}
        />
      );
    } else if (step === 1) {
      content = (
        <StepParishInfo
          key={stepKey}
          membershipRole={membershipRole}
          onNext={(pid) => {
            setParishId(pid);
            goToStep(2);
          }}
          onBack={() => goToStep(0)}
        />
      );
    } else if (step === 2) {
      content = parishId ? (
        <StepChurches
          key={stepKey}
          parishId={parishId}
          parishName={mainChurchName || ""}
          onNext={(mcName) => {
            setMainChurchName(mcName);
            goToStep(3);
          }}
          onBack={() => goToStep(1)}
        />
      ) : null;
    } else if (step === 3) {
      content = parishId ? (
        <StepClergy
          key={stepKey}
          parishId={parishId}
          currentUserName={name || currentUser?.name || ""}
          currentUserClergyType={clergyType}
          onNext={() => goToPhase(1, 0)}
          onBack={() => goToStep(2)}
        />
      ) : null;
    }
  } else if (phase === 1) {
    // IMPORT PHASE
    if (step === 0) {
      content = (
        <StepImportChoice
          key={stepKey}
          onChooseICal={() => {
            setImportMethod("ical");
            goToStep(1);
          }}
          onChooseManual={() => {
            setImportMethod("manual");
            goToStep(1);
          }}
          onBack={() => goToPhase(0, 3)}
        />
      );
    } else if (step === 1 && importMethod === "ical") {
      content = (
        <StepICalImport
          key={stepKey}
          onNext={(events) => {
            setParsedEvents(events);
            goToStep(2);
          }}
          onBack={() => goToStep(0)}
        />
      );
    } else if (step === 1 && importMethod === "manual") {
      content = parishId && mainChurchId ? (
        <StepManualActivities
          key={stepKey}
          parishId={parishId}
          mainChurchId={mainChurchId}
          onNext={() => goToPhase(2, 0)}
          onBack={() => goToStep(0)}
        />
      ) : null;
    } else if (step === 2 && importMethod === "ical") {
      content = parishId && mainChurchId ? (
        <StepEventMapping
          key={stepKey}
          parishId={parishId}
          mainChurchId={mainChurchId}
          events={parsedEvents.map((ev) => ({
            uid: ev.uid,
            title: ev.title,
            dtstart: ev.dtstart,
            time: ev.time,
            isRecurring: ev.isRecurring,
            rrule: ev.rrule,
            type: ev.suggestedType,
            schedule: ev.suggestedSchedule,
          }))}
          onNext={() => goToPhase(2, 0)}
          onBack={() => goToStep(1)}
        />
      ) : null;
    }
  } else if (phase === 2) {
    // GENERATE PHASE
    if (step === 0) {
      content = (
        <StepRules
          key={stepKey}
          onNext={async () => {
            goToStep(1);
            await runGeneration(rotaRange);
          }}
          onBack={() => goToPhase(1, 0)}
        />
      );
    } else if (step === 1) {
      const { startDate, endDate } = computeRange(rotaRange);
      content = parishId ? (
        <StepPreviewRota
          key={stepKey}
          parishId={parishId}
          rotaId={rotaId ?? undefined}
          violationCount={violationCount}
          onNext={() => goToStep(2)}
          onBack={() => goToStep(0)}
          onRangeChange={async (r) => {
            setRotaRange(r);
            await runGeneration(r);
          }}
          currentRange={rotaRange}
          slots={rotaSlots}
          startDate={startDate}
          endDate={endDate}
          loading={generating || (!!rotaId && assignments === undefined)}
        />
      ) : null;
    } else if (step === 2) {
      content = parishId && rotaId ? (
        <StepFinalize
          key={stepKey}
          parishName={mainChurchName || ""}
          parishId={parishId}
          rotaId={rotaId}
          assignedCount={assignedCount}
          violationCount={violationCount}
          slots={rotaSlots}
          onDone={handleDone}
        />
      ) : (
        <div style={{ fontFamily: SANS, color: C.muted, fontSize: 14 }}>
          Loading assignments…
        </div>
      );
    }
  }

  return (
    <OnboardingLayout phase={phase}>
      <PhaseProgress steps={phaseSteps} currentStep={visibleStep} />
      {content}
    </OnboardingLayout>
  );
}
