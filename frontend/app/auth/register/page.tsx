"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import api from "@/lib/axios";
import { Sparkles, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT"); // Default role
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, role });
      await register(email, password);
    } catch (err: any) {
      console.error(err);
      alert("Registration failed. Please try again.");
      setError(err.response?.data?.message || "Registration failed"); // Keep original error message for display
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Left Side - Branding (Google Devs Style) */}
      <div className="hidden lg:flex w-1/2 bg-[#F8F9FA] relative flex-col justify-between p-16 border-r border-slate-200">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-[#1a73e8] flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-medium tracking-tight text-slate-800">
              Youva-EdAi
            </span>
          </div>

          <div className="max-w-md space-y-8">
            <h1 className="text-5xl font-medium tracking-tight text-slate-900 leading-[1.1]">
              Join the <br />
              <span className="text-[#1a73e8]">future of learning</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-light">
              Create an account to access personalized AI tutoring, real-time
              analytics, and a world of knowledge at your fingertips.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-6 text-sm text-slate-500 font-medium">
          <span>© 2026 Youva-EdAi Inc.</span>
          <a href="#" className="hover:text-[#1a73e8]">
            Privacy
          </a>
          <a href="#" className="hover:text-[#1a73e8]">
            Terms
          </a>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-[#E2E8F0]">
        <div className="w-[400px] max-w-full space-y-8 p-10 clay-card">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-slate-900">
              Create account
            </h2>
            <p className="mt-2 text-base text-slate-600">
              to get started with Youva-EdAi
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-[4px] bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  required
                  className="peer w-full h-[54px] px-4 clay-input text-base text-slate-900 placeholder-transparent focus:outline-none"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Email
                </label>
              </div>

              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  required
                  className="peer w-full h-[54px] px-4 clay-input text-base text-slate-900 placeholder-transparent focus:outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Password
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-sm font-medium text-slate-700 block mb-1">
                  I am a
                </span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`flex-1 h-[48px] rounded-2xl text-sm font-medium transition-all ${role === "STUDENT" ? "clay-btn bg-[#1a73e8] text-white" : "clay-input text-slate-600 hover:bg-[#eef2f6]"}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("TEACHER")}
                    className={`flex-1 h-[48px] rounded-2xl text-sm font-medium transition-all ${role === "TEACHER" ? "clay-btn bg-[#1a73e8] text-white" : "clay-input text-slate-600 hover:bg-[#eef2f6]"}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex justify-between items-center w-full">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] py-2 px-1"
                >
                  Sign in instead
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-3 h-[44px] clay-btn text-sm font-medium focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>

              {/* Demo Section */}
              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500">Or try a demo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    // Quick login function for the demo skipping registration
                    try {
                      setLoading(true);
                      await login("student@test.com", "password123");
                    } catch (e) {
                      // Attempt raw route login
                      window.location.href = '/auth/login';
                    }
                  }}
                  className="flex items-center justify-center h-[44px] px-4 font-medium text-slate-700 bg-[#E2E8F0] clay-btn focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                >
                  Demo Student
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await login("teacher@test.com", "password123");
                    } catch (e) {
                      window.location.href = '/auth/login';
                    }
                  }}
                  className="flex items-center justify-center h-[44px] px-4 font-medium text-slate-700 bg-[#E2E8F0] clay-btn focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                >
                  Demo Teacher
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
