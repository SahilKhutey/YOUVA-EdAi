'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Files, Layers, Cog, Play, FileText, Settings2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorksheetBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [worksheet, setWorksheet] = useState<any>(null);
    const [formData, setFormData] = useState({
        topic: '',
        difficulty: 'INTERMEDIATE',
        numberOfQuestions: 5,
        questionTypes: ['MCQ', 'SHORT_ANSWER']
    });

    const typesAvailable = ['MCQ', 'SHORT_ANSWER', 'PROBLEM_SOLVING', 'REASONING'];

    const toggleType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            questionTypes: prev.questionTypes.includes(type)
                ? prev.questionTypes.filter(t => t !== type)
                : [...prev.questionTypes, type]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/worksheet/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok && data.id) {
                setWorksheet(data);
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to generate worksheet. Ensure backend AI service is running.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!worksheet) return;
        setLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/worksheet/${worksheet.id}/publish`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Worksheet Published!');
            router.push('/dashboard/teacher/sessions'); // Or wherever appropriate
        } catch (err) {
            alert('Failed to publish');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>;

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-screen">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight flex items-center gap-3">
                        <Files className="w-10 h-10 text-primary" />
                        Worksheet Builder
                    </h1>
                    <p className="text-muted-foreground text-lg">Generate auto-grading worksheets via AI or upload existing materials.</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!worksheet ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl border shadow-xl p-8 md:p-10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2"></div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <FileText className="w-4 h-4 text-primary" /> Topic / Concept
                                    </label>
                                    <input type="text" required placeholder="e.g. Balancing Chemical Equations" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm text-lg font-medium" />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <Layers className="w-4 h-4 text-primary" /> Difficulty
                                    </label>
                                    <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 outline-none shadow-sm font-medium text-slate-700">
                                        <option value="BEGINNER">Beginner</option>
                                        <option value="INTERMEDIATE">Intermediate</option>
                                        <option value="ADVANCED">Advanced</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <Settings2 className="w-4 h-4 text-primary" /> Number of Questions
                                    </label>
                                    <input type="number" min="1" max="50" value={formData.numberOfQuestions} onChange={e => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })} className="w-full p-4 rounded-xl border bg-slate-50 outline-none shadow-sm font-medium" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <Cog className="w-4 h-4 text-primary" /> Include Question Types
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {typesAvailable.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleType(type)}
                                            className={`px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.questionTypes.includes(type) ? 'border-primary bg-primary/10 text-primary scale-105 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t flex justify-end">
                                <button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 px-10 py-4 rounded-2xl font-bold inline-flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {loading ? 'Generating Magic...' : 'Generate Auto-Graded Worksheet'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-3xl border shadow-md p-8 flex justify-between items-center border-l-8 border-l-indigo-500">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800">{worksheet.title}</h2>
                                <p className="text-slate-500 mt-2 font-medium flex gap-4">
                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">{worksheet.difficulty}</span>
                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">{worksheet.questions.length} Questions</span>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setWorksheet(null)} className="px-6 py-3 rounded-xl border hover:bg-slate-50 font-semibold transition-colors">Discard</button>
                                <button onClick={handlePublish} disabled={loading} className="px-8 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 font-bold inline-flex items-center gap-2 transition-transform hover:scale-105">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    Publish Worksheet
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {worksheet.questions.map((q: any, i: number) => {
                                let options = [];
                                try { if (q.options) options = JSON.parse(q.options); } catch (e) { }
                                return (
                                    <motion.div
                                        key={q.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-6"
                                    >
                                        <div className="flex justify-between mb-4">
                                            <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wider">QUESTION {q.order} • {q.type.replace('_', ' ')}</span>
                                            <span className="text-slate-400 font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg">{q.points} pts</span>
                                        </div>
                                        <p className="font-bold text-lg text-slate-800 mb-6">{q.content}</p>

                                        {options.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                                {options.map((opt: string, idx: number) => (
                                                    <div key={idx} className={`p-4 rounded-xl border-2 font-medium ${opt === q.correctAnswer ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                                                        {String.fromCharCode(65 + idx)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 text-amber-900 border-l-4 border-l-amber-400">
                                            <Sparkles className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm text-amber-800 mb-1">AI Explainer / Rubric</p>
                                                <p className="text-sm font-medium text-amber-900/80">{q.explanation}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
