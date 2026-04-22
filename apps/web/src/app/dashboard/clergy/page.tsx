"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";

const CLERGY_TYPES = ["bishop", "priest", "deacon", "religious", "sister"] as const;
const AVAILABLE_ROLES = ["celebrant", "homilist", "confessor", "deacon_of_mass"];

export default function ClergyPage() {
  const parish = useQuery(api.parishes.getMyParish);
  const clergy = useQuery(
    api.clergy.list,
    parish ? { parishId: parish._id } : "skip"
  );
  const invite = useMutation(api.clergy.invite);
  const remove = useMutation(api.clergy.remove);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<typeof CLERGY_TYPES[number]>("priest");
  const [roles, setRoles] = useState<string[]>(["celebrant"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!parish) return;
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await invite({
        parishId: parish._id,
        name: name.trim(),
        email: email.trim(),
        type,
        roles,
      });
      setShowForm(false);
      setName("");
      setEmail("");
      setRoles(["celebrant"]);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (!parish || !clergy) return <p className="p-8">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clergy</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
        >
          + Invite clergy
        </button>
      </div>

      {showForm && (
        <div className="border rounded-xl p-6 mb-6 flex flex-col gap-4">
          <h2 className="font-semibold">Invite a clergy member</h2>

          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            className="border rounded-lg px-4 py-2 bg-white"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            {CLERGY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <div>
            <p className="text-sm font-medium mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    roles.includes(role)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={loading}
              className="flex-1 bg-black text-white rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {loading ? "Inviting..." : "Send invite"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border rounded-lg px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {clergy.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No clergy yet. Invite someone to get started.
          </p>
        )}
        {clergy.map((c) => (
          <div
            key={c._id}
            className="border rounded-xl px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-gray-500">{c.email}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {c.type}
                </span>
                {c.roles.map((r) => (
                  <span
                    key={r}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {r}
                  </span>
                ))}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => remove({ clergyId: c._id as Id<"clergy"> })}
              className="text-red-500 text-sm hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}