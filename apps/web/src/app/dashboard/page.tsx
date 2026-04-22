"use client";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../../convex/_generated/api";

export default function Dashboard() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Ordo Dashboard</h1>
      <p className="text-gray-500">
        Welcome, {user?.name ?? user?.email}
      </p>
      <button
        onClick={() => signOut()}
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Sign out
      </button>
    </div>
  );
}