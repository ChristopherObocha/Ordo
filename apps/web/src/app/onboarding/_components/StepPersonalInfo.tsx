"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import {
  C, SANS,
  OInput, OSelect, Field, StepHeader, StepNav,
} from "./shared";

type Props = {
  onNext: (data: {
    name: string;
    membershipRole: "parish_priest" | "administrator";
    clergyType: "bishop" | "priest" | "deacon" | "religious" | "sister";
  }) => void;
};

const ROLE_OPTIONS = [
  { value: "parish_priest", label: "Parish Priest" },
  { value: "administrator", label: "Administrator" },
];

const CLERGY_TYPE_OPTIONS = [
  { value: "bishop",    label: "Bishop" },
  { value: "priest",    label: "Priest" },
  { value: "deacon",    label: "Deacon" },
  { value: "religious", label: "Religious" },
  { value: "sister",    label: "Sister" },
];

export function StepPersonalInfo({ onNext }: Props) {
  const [name, setName] = useState("");
  const [membershipRole, setMembershipRole] = useState<"parish_priest" | "administrator">("parish_priest");
  const [clergyType, setClergyType] = useState<"bishop" | "priest" | "deacon" | "religious" | "sister">("priest");

  const updateProgress = useMutation(api.users.updateOnboardingProgress);

  const handleNext = async () => {
    await updateProgress({ phase: "setup", step: 1 });
    onNext({ name, membershipRole, clergyType });
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Tell us about yourself"
        subtitle="We'll set up your account and get your parish ready."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Your name">
          <OInput
            value={name}
            onChange={setName}
            placeholder="e.g. Fr. John Smith"
          />
        </Field>

        <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Your role">
              <OSelect
                value={membershipRole}
                onChange={(v) => setMembershipRole(v as "parish_priest" | "administrator")}
                options={ROLE_OPTIONS}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="I am a">
              <OSelect
                value={clergyType}
                onChange={(v) => setClergyType(v as "bishop" | "priest" | "deacon" | "religious" | "sister")}
                options={CLERGY_TYPE_OPTIONS}
              />
            </Field>
          </div>
        </div>
      </div>

      <StepNav
        onNext={handleNext}
        canNext={name.trim().length > 0}
        nextLabel="Continue →"
      />
    </div>
  );
}
