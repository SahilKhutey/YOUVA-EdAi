'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, BrainCircuit, Sparkles, ChevronLeft, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorksheetResultPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const submissionId = params.submissionId as string;

    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState<any>(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/worksheet/submission/${submissionId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    setSubmission(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [submissionId]);

    if (loading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!submission) return <div className="p-10 text-center text-red-500 font-bold">Results not found.</div>;

    const score = submission.score || 0;
    const isPass = score >= 70;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen">
            <button onClick={() => router.push('/dashboard/student')} className="mb-8 font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-3xl border shadow-xl p-10 mb-10 relative overflow-hidden text-center z-10 ${isPass ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400' : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400'}`}
            >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

                <Award className="w-20 h-20 mx-auto mb-4 opacity-90" />
                <h1 className="text-5xl font-extrabold tracking-tight mb-2">{score.toFixed(0)}%</h1>
                <p className="text-xl font-medium opacity-90 mb-6">{isPass ? 'Outstanding work! Concept mastered.' : 'Needs Review. Let\'s look at the AI feedback.'}</p>
                <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase border border-white/20">
                    <BrainCircuit className="w-4 h-4" /> Auto-Graded by AI
                </div>
            </motion.div>

            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Detailed Feedback</h2>

            <div className="space-y-6">
                {submission.answers.map((ans: any, i: number) => {
                    const q = ans.question;
                    const correct = ans.isCorrect;

                    return (
                        <motion.div
                            key={ans.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`bg-white rounded-3xl border-2 shadow-sm p-6 relative overflow-hidden ${correct ? 'border-emerald-100' : 'border-rose-100'}`}
                        >
                            <div className={`absolute top-0 left-0 w-2 h-full ${correct ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-4">
                                <span className={`font-bold flex items-center gap-2 ${correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {correct ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                    Question {i + 1}
                                </span>
                                <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">
                                    {ans.pointsAwarded} / {q.points} pts
                                </span>
                            </div>

                            <p className="text-lg font-bold text-slate-800 mb-6 pl-4">{q.content}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 mb-6">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Answer</p>
                                    <p className="font-semibold text-slate-700">{ans.studentAnswer}</p>
                                </div>
                                {!correct && (
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Ideal Answer / Concept</p>
                                        <p className="font-semibold text-emerald-800">{q.correctAnswer || q.explanation}</p>
                                    </div>
                                )}
                            </div>

                            {ans.feedback && !correct && (
                                <div className="ml-4 bg-indigo-50 rounded-2xl p-5 border border-indigo-100 flex gap-4 text-indigo-900 shadow-inner">
                                    <Sparkles className="w-6 h-6 mt-1 text-indigo-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-indigo-800 mb-1">AI Teacher Feedback</p>
                                        <p className="font-medium text-indigo-900/80 leading-relaxed">{ans.feedback}</p>
                                    </div>
                                </div>
                            )}

                            {/* Positive reinforcement from AI if correct on complex types */}
                            {ans.feedback && correct && q.type !== 'MCQ' && (
                                <div className="ml-4 bg-emerald-50 rounded-2xl p-5 flex gap-4 text-emerald-900 border border-emerald-100">
                                    <Sparkles className="w-6 h-6 mt-1 text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-emerald-800 mb-1">AI Teacher Comments</p>
                                        <p className="font-medium text-emerald-900/80 leading-relaxed">{ans.feedback}</p>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
