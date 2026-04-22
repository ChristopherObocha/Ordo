"use client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";

const PARISH_TYPES = [
  { value: "parish", label: "Parish" },
  { value: "cathedral", label: "Cathedral" },
  { value: "abbey", label: "Abbey" },
  { value: "seminary", label: "Seminary" },
  { value: "chaplaincy", label: "Chaplaincy" },
  { value: "shrine", label: "Shrine" },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const createParish = useMutation(api.parishes.create);

  const [name, setName] = useState("");
  const [type, setType] = useState<"parish" | "cathedral" | "abbey" | "seminary" | "chaplaincy" | "shrine">("parish");
  const [diocese, setDiocese] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createParish({
        name: name.trim(),
        type,
        diocese: diocese.trim() || undefined,
        locale: "en-GB",
        timezone: "Europe/London",
      });
      router.push("/dashboard");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-md mx-auto px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to Ordo</h1>
        <p className="text-gray-500 mt-2">
          Let&apos;s set up your parish. You can update these details later.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Parish name
          </label>
          <input
            className="mt-1 w-full border rounded-lg px-4 py-2"
            placeholder="e.g. St. Joseph's Catholic Church"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            className="mt-1 w-full border rounded-lg px-4 py-2 bg-white"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            {PARISH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Diocese <span className="text-gray-400">(optional)</span>
          </label>
          <input
            className="mt-1 w-full border rounded-lg px-4 py-2"
            placeholder="e.g. Diocese of Westminster"
            value={diocese}
            onChange={(e) => setDiocese(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-black text-white rounded-lg px-4 py-3 font-medium disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create parish"}
        </button>
      </div>
    </div>
  );
}