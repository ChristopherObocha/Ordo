"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  console.log('email: ', email, 'password: ', password, 'name: ', name);

  const handleSubmit = async () => {
    setError("");
    try {
      console.log('email: ', email, 'password: ', password, 'name: ', name);
      await signIn("password", { email, password, name, flow });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.log('error: ', error);
      setError(error?.message ?? "Something went wrong");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Ordo</h1>
      <p className="text-gray-500 text-sm">
        {flow === "signIn" ? "Sign in to your account" : "Create an account"}
      </p>

      {flow === "signUp" && (
        <input
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <input
        className="w-full border rounded-lg px-4 py-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full border rounded-lg px-4 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white rounded-lg px-4 py-2"
      >
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </button>

      <button
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        className="text-sm text-gray-500 underline"
      >
        {flow === "signIn"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}