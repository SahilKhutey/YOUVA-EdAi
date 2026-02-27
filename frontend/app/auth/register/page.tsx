"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import api from "@/lib/axios";
import { Sparkles, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT"); // Default role
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/register", { email, password, role });
      await register(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px] space-y-8">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  required
                  className="peer w-full h-[52px] px-3.5 rounded-[4px] border border-slate-300 text-base text-slate-900 placeholder-transparent focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all bg-white"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-slate-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Email
                </label>
              </div>

              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  required
                  className="peer w-full h-[52px] px-3.5 rounded-[4px] border border-slate-300 text-base text-slate-900 placeholder-transparent focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all bg-white"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-slate-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                >
                  Password
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-sm font-medium text-slate-700 block mb-1">
                  I am a
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`h-[40px] rounded-[4px] border text-sm font-medium transition-all ${role === "STUDENT" ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("TEACHER")}
                    className={`h-[40px] rounded-[4px] border text-sm font-medium transition-all ${role === "TEACHER" ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Link
                href="/auth/login"
                className="mr-auto text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] py-2 px-1"
              >
                Sign in instead
              </Link>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-[4px] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a73e8] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
