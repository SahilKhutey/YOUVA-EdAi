"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/app/components/MainLayout";
import api from "@/lib/axios";
import { CheckCircle2, ChevronRight, FileText, UploadCloud, BrainCircuit, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProjectAssessmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [submission, setSubmission] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Hardcoded project prompt for demo purposes
    const projectDetails = {
        title: "Quantum Physics: Superposition Essay",
        prompt: "Write a comprehensive 500-word essay explaining the concept of Quantum Superposition and its theoretical applications in quantum computing. Ensure logical flow and original analogies.",
        rubric: "Logic (40%), Originality (40%), Technical Accuracy (20%)",
        topicId: "physics-quantum-1", // Assume this maps to a generic or existing topic
    };

    const handleSubmit = async () => {
        if (!submission.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            // 1. Assign the project to the student (simulating a teacher's action)
            const assignRes = await api.post("/assessment-intelligence/assign", {
                userId: user?.id,
                topicId: projectDetails.topicId,
                prompt: projectDetails.prompt,
                gradingRubric: projectDetails.rubric,
            });

            const projectId = assignRes.data.id;

            // 2. Evaluate the student's submission
            const evalRes = await api.post(`/assessment-intelligence/evaluate/${projectId}`, {
                submissionContent: submission,
            });

            setResult(evalRes.data);
        } catch (error) {
            console.error("Evaluation failed", error);
            alert("Assessment Intelligence service is currently warming up or encountered an error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <MainLayout>
            <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover w-fit">
                        Assessment Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Submit real-world projects for instant AI-driven evaluation.
                    </p>
                </div>

                <div className="clay-card p-6 md:p-8 space-y-6 bg-white">
                    <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{projectDetails.title}</h2>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                {projectDetails.prompt}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold">
                                <BrainCircuit className="w-4 h-4" />
                                AI Rubric: {projectDetails.rubric}
                            </div>
                        </div>
                    </div>

                    {!result ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-slate-700">Your Submission</label>
                            <textarea
                                value={submission}
                                onChange={(e) => setSubmission(e.target.value)}
                                placeholder="Paste your essay, code, or project thesis here..."
                                className="w-full min-h-[300px] p-4 rounded-xl border-border bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-y clay-input"
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !submission.trim()}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed clay-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 auto-spin" />
                                        Analyzing Logic & Originality...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-5 h-5" />
                                        Submit for AI Evaluation
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    <h3 className="text-2xl font-black text-indigo-950">Evaluation Complete</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Logic Score</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">
                                            {Math.round(result.gradingResult.logicScore * 100)}%
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Originality</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">
                                            {Math.round(result.gradingResult.originalityScore * 100)}%
                                        </p>
                                    </div>
                                    <div className="bg-primary text-white p-4 rounded-xl shadow-sm">
                                        <p className="text-xs font-bold text-primary-foreground/80 uppercase">Overall Mastery</p>
                                        <p className="text-3xl font-black mt-1">
                                            {Math.round(result.gradingResult.overallValidation * 100)}%
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white/60 p-5 rounded-xl text-sm text-indigo-900 leading-relaxed mb-6 border border-white">
                                    <span className="font-bold block mb-2">AI Feedback:</span>
                                    {result.gradingResult.feedback}
                                </div>

                                {result.mintedCredentialUrl && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-green-100 text-green-800 rounded-xl">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-0">
                                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                                <BrainCircuit className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Skill Credential Minted!</p>
                                                <p className="text-xs opacity-80 font-mono">{result.mintedCredentialUrl.substring(0, 16)}...</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/dashboard/credentials')}
                                            className="px-4 py-2 bg-white text-green-700 text-sm font-bold rounded-lg shadow-sm hover:shadow"
                                        >
                                            View Wallet
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
