"use client";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../../convex/_generated/api";

export default function Dashboard() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const parish = useQuery(api.parishes.getMyParish);

  
  useEffect(() => {
    if (parish === null) {
      router.push("/onboarding");
      console.log('parish is null, pushing to onboarding');
    }
  }, [parish, router]);

  if (user === undefined || parish === undefined) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">{parish?.name}</h1>
      <p className="text-gray-500">
        Welcome!, {user?.name ?? user?.email}
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