'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ProctorHarness } from '@/app/components/assessment/ProctorHarness';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';

export default function AssessmentPage() {
    const params = useParams();
    const topicId = params.topicId as string;
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const startAssessment = useCallback(async () => {
        if (!topicId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/assessment/start', { topicId });
            setSessionData(res.data.session);
            setQuestions(res.data.questions);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to start assessment. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user && topicId) {
            startAssessment();
        }
    }, [user, authLoading, topicId, startAssessment, router]);

    const submitAssessment = async (finalAnswers: any[]) => {
        if (!sessionData?.id) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/assessment/${sessionData.id}/submit`, { answers: finalAnswers });
            setResult(res.data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to submit assessment. Please contact support.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectOption = (option: string) => {
        const question = questions[currentQuestionIndex];
        const isCorrect = option === question.correctAnswer;

        const newAnswer = {
            questionId: `rand-${currentQuestionIndex}`,
            answer: option,
            isCorrect,
        };

        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = newAnswer;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitAssessment(answers);
        }
    };

    if (authLoading || (loading && !error)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground animate-pulse">Initializing Secure Environment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white p-8 clay-card text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Error Occurred</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/subjects')}
                        className="w-full py-3 bg-primary text-primary-foreground font-medium clay-btn"
                    >
                        Back to Subjects
                    </button>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="flex w-full min-h-screen bg-slate-50 items-center justify-center px-4">
                <div className="max-w-xl w-full p-8 md:p-12 text-center bg-white clay-card">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Assessment Complete</h1>
                    <p className="text-muted-foreground mb-8">Your results have been securely processed.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-6 clay-card">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Final Score</p>
                            <p className="text-3xl font-black text-primary">{result.score.toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 p-6 clay-card">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Integrity</p>
                            <p className={`text-3xl font-black ${result.session.integrityScore < 70 ? 'text-destructive' : 'text-emerald-600'}`}>
                                {result.session.integrityScore}%
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/subjects')}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-transform clay-btn"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];

    return (
        <ProctorHarness sessionId={sessionData?.id}>
            <div className="max-w-4xl mx-auto w-full pt-12 pb-24 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Secure Certification</h1>
                        <p className="text-muted-foreground font-medium">Topic ID: {topicId}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 clay-card">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">
                            Question {currentQuestionIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>

                <div className="bg-white clay-card p-6 md:p-10 mb-8 min-h-[400px] flex flex-col justify-center border-b-4 border-b-primary/10">
                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 block">Problem {currentQuestionIndex + 1}</span>
                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed text-slate-800">{currentQ?.content}</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQ?.options?.map((option: string, i: number) => {
                            const isSelected = currentAnswer?.answer === option;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelectOption(option)}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                                        : 'bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-slate-200'}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className={`font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground font-medium italic">
                        Responses are auto-saved locally during the session.
                    </p>
                    <button
                        onClick={handleNext}
                        disabled={!currentAnswer || isSubmitting}
                        className="px-10 py-4 bg-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center gap-3 hover:scale-[1.02] transition-transform clay-btn"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        {currentQuestionIndex === questions.length - 1 ? 'Finish & Submit' : 'Save & Continue'}
                    </button>
                </div>
            </div>
        </ProctorHarness>
    );
}
