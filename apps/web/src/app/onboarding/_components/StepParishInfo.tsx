"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import {
  C, SANS,
  OInput, OSelect, Field, StepHeader, StepNav,
} from "./shared";

type Props = {
  membershipRole: "parish_priest" | "administrator";
  onNext: (parishId: string) => void;
  onBack: () => void;
};

const PARISH_TYPE_OPTIONS = [
  { value: "parish",     label: "Parish" },
  { value: "cathedral",  label: "Cathedral" },
  { value: "abbey",      label: "Abbey" },
  { value: "seminary",   label: "Seminary" },
  { value: "chaplaincy", label: "Chaplaincy" },
  { value: "shrine",     label: "Shrine" },
];

const LOCALE_OPTIONS = [
  { value: "en-GB", label: "England & Wales" },
  { value: "en-IE", label: "Ireland" },
  { value: "en-US", label: "United States" },
  { value: "gd-GB", label: "Scotland" },
  { value: "other", label: "Other" },
];

const LOCALE_TIMEZONE_MAP: Record<string, string> = {
  "en-GB": "Europe/London",
  "en-IE": "Europe/Dublin",
  "en-US": "America/New_York",
  "gd-GB": "Europe/London",
  "other":  "UTC",
};

export function StepParishInfo({ membershipRole, onNext, onBack }: Props) {
  const [name, setName]       = useState("");
  const [diocese, setDiocese] = useState("");
  const [type, setType]       = useState<"parish" | "cathedral" | "abbey" | "seminary" | "chaplaincy" | "shrine">("parish");
  const [locale, setLocale]   = useState("en-GB");
  const [timezone, setTimezone] = useState("Europe/London");
  const [loading, setLoading] = useState(false);

  const createParish = useMutation(api.parishes.create);

  // Auto-update timezone when locale changes
  useEffect(() => {
    setTimezone(LOCALE_TIMEZONE_MAP[locale] ?? "UTC");
  }, [locale]);

  const handleNext = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const parishId = await createParish({
        name,
        type,
        diocese: diocese.trim() || undefined,
        locale,
        timezone,
        membershipRole,
      });
      onNext(parishId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ordo-slide-in">
      <StepHeader
        title="Set up your parish"
        subtitle="You can add satellite churches in the next step."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Parish name">
          <OInput
            value={name}
            onChange={setName}
            placeholder="e.g. St. Mary's Catholic Church"
          />
        </Field>

        <Field label="Diocese">
          <OInput
            value={diocese}
            onChange={setDiocese}
            placeholder="e.g. Diocese of Exeter"
          />
        </Field>

        <Field label="Type">
          <OSelect
            value={type}
            onChange={(v) => setType(v as typeof type)}
            options={PARISH_TYPE_OPTIONS}
          />
        </Field>

        <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Country / Rite">
              <OSelect
                value={locale}
                onChange={setLocale}
                options={LOCALE_OPTIONS}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Timezone">
              <OInput
                value={timezone}
                onChange={setTimezone}
                placeholder="e.g. Europe/London"
              />
            </Field>
          </div>
        </div>
      </div>

      <StepNav
        onNext={handleNext}
        onBack={onBack}
        canNext={name.trim().length > 0}
        nextLabel="Continue →"
        loading={loading}
      />
    </div>
  );
}
