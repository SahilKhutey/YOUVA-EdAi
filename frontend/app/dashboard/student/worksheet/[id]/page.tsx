'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Sparkles, Send, BrainCircuit, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentWorksheetPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const worksheetId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [worksheet, setWorksheet] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchWorksheet = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/worksheet/${worksheetId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    setWorksheet(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorksheet();
    }, [worksheetId]);

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!worksheet) return;
        setSubmitting(true);

        const payload = {
            answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({
                questionId,
                studentAnswer
            }))
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/worksheet/${worksheetId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const submission = await res.json();
                router.push(`/dashboard/student/worksheet/result/${submission.id}`);
            } else {
                throw new Error('Submit failed');
            }
        } catch (err) {
            alert('Failed to submit worksheet');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    if (!worksheet) return <div className="p-10 text-center text-red-500 font-bold">Worksheet not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen pb-32">
            <div className="mb-10 text-center">
                <span className="bg-indigo-100 text-indigo-700 font-bold px-4 py-1.5 rounded-full text-xs tracking-wider uppercase mb-4 inline-block shadow-sm ring-1 ring-indigo-200">
                    AI-Assigned Worksheet
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">{worksheet.title}</h1>
                <p className="text-slate-500 font-medium text-lg flex justify-center items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {worksheet.questions.length} Questions • Complete carefully
                </p>
            </div>

            <div className="space-y-8">
                {worksheet.questions.map((q: any, i: number) => {
                    let options = [];
                    try { if (q.options) options = JSON.parse(q.options); } catch (e) { }

                    return (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>

                            <div className="flex justify-between items-start mb-6">
                                <span className="font-bold text-primary flex items-center gap-2">
                                    <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center pt-[2px]">{i + 1}</span>
                                    {q.type.replace('_', ' ')}
                                </span>
                                <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg border">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                            </div>

                            <p className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">{q.content}</p>

                            {q.type === 'MCQ' && options.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {options.map((opt: string, idx: number) => {
                                        const isSelected = answers[q.id] === opt;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswerChange(q.id, opt)}
                                                className={`text-left p-4 rounded-xl border-2 font-medium transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary shadow-inner scale-[1.02]' : 'border-slate-200 hover:border-primary/40 bg-white text-slate-600'}`}
                                            >
                                                <span className="inline-block w-6 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span> {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <textarea
                                    rows={4}
                                    placeholder="Type your detailed answer here..."
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none text-slate-700 font-medium"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Sticky Submit Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] z-50 flex justify-center">
                <div className="max-w-4xl w-full flex justify-between items-center">
                    <div className="text-slate-500 font-medium flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Ensure all answers are final before submitting.
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(answers).length < worksheet.questions.length}
                        className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-3 text-lg"
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {submitting ? 'Auto-Grading via AI...' : 'Submit Worksheet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
