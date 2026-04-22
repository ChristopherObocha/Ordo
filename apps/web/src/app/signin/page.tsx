"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

type Flow = "signIn" | "signUp" | "otp";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, name, flow: flow as "signIn" | "signUp" });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("resend-otp", { email });
      setFlow("otp");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("resend-otp", { email, code });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (flow === "otp") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 max-w-sm mx-auto px-4">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-gray-500 text-sm">We sent a code to {email}</p>
        <input
          className="w-full border rounded-lg px-4 py-2 text-center text-2xl tracking-widest"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="w-full bg-black text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify code"}
        </button>
        <button
          onClick={() => setFlow("signIn")}
          className="text-sm text-gray-500 underline"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 max-w-sm mx-auto px-4">
      <h1 className="text-2xl font-bold">Ordo</h1>

      {/* OTP section */}
      <div className="w-full flex flex-col gap-2">
        <p className="text-sm text-gray-500 text-center">Sign in with email code</p>
        <input
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSendOTP}
          disabled={loading}
          className="w-full bg-black text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send code"}
        </button>
      </div>

      <div className="flex items-center w-full gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Password section */}
      <div className="w-full flex flex-col gap-2">
        <p className="text-sm text-gray-500 text-center">
          {flow === "signIn" ? "Sign in with password" : "Create an account"}
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
          onClick={handlePasswordSubmit}
          disabled={loading}
          className="w-full bg-black text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Loading..." : flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <button
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          className="text-sm text-gray-500 underline text-center"
        >
          {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}