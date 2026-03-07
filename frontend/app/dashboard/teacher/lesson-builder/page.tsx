'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen, Clock, Target, Play, Sparkles, Plus, LayoutDashboard, BrainCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LessonBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [lessonPlan, setLessonPlan] = useState<any>(null);
    const [formData, setFormData] = useState({
        subject: '',
        topicName: '',
        studentLevel: 'TEEN',
        learningObjective: '',
        durationMinutes: 45,
        preferredMethod: 'Interactive Visuals'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/lesson-plan/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok && data.id) {
                setLessonPlan(data);
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to generate lesson plan. Ensure backend AI service is running.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!lessonPlan) return;
        setLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/lesson-plan/${lessonPlan.id}/publish`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Lesson Plan Published! Students can now be invited to a session.');
            router.push('/dashboard/teacher/sessions');
        } catch (err) {
            alert('Failed to publish');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>;

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-screen">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-primary" />
                    AI Lesson Builder
                </h1>
                <p className="text-muted-foreground text-lg">Generate structured learning flows for one-to-one digital classrooms.</p>
            </div>

            <AnimatePresence mode="wait">
                {!lessonPlan ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl border shadow-xl p-8 md:p-10 relative overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <BookOpen className="w-4 h-4 text-primary" /> Subject
                                    </label>
                                    <input type="text" required placeholder="e.g. Physics" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <LayoutDashboard className="w-4 h-4 text-primary" /> Topic
                                    </label>
                                    <input type="text" required placeholder="e.g. Newton's Laws" value={formData.topicName} onChange={e => setFormData({ ...formData, topicName: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Student Level</label>
                                    <select value={formData.studentLevel} onChange={e => setFormData({ ...formData, studentLevel: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 outline-none shadow-sm">
                                        <option value="CHILD">Child (Ages 7-12)</option>
                                        <option value="TEEN">Teen (Ages 13-17)</option>
                                        <option value="ADULT">Adult</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <Clock className="w-4 h-4 text-primary" /> Duration (Mins)
                                    </label>
                                    <input type="number" min="15" max="180" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })} className="w-full p-4 rounded-xl border bg-slate-50 outline-none shadow-sm" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                        <BrainCog className="w-4 h-4 text-primary" /> Preferred Method
                                    </label>
                                    <select value={formData.preferredMethod} onChange={e => setFormData({ ...formData, preferredMethod: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 outline-none shadow-sm">
                                        <option value="Interactive Visuals">Interactive Visuals</option>
                                        <option value="Socratic Questioning">Socratic Questioning</option>
                                        <option value="Problem Based">Problem Based</option>
                                        <option value="Theory First">Theory First</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <Target className="w-4 h-4 text-primary" /> Learning Objective
                                </label>
                                <textarea required rows={3} placeholder="Master the 3 laws of motion and solve basic problems..." value={formData.learningObjective} onChange={e => setFormData({ ...formData, learningObjective: e.target.value })} className="w-full p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none shadow-sm" />
                            </div>

                            <div className="pt-6 border-t flex justify-end">
                                <button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 px-10 py-4 rounded-2xl font-bold inline-flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {loading ? 'Orchestrating Lesson...' : 'Generate Full Lesson Plan'}
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
                        <div className="bg-white rounded-3xl border shadow-md p-8 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">{lessonPlan.subject}: {lessonPlan.topicName}</h2>
                                <p className="text-muted-foreground mt-2 font-medium">{lessonPlan.learningObjective}</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setLessonPlan(null)} className="px-6 py-3 rounded-xl border hover:bg-slate-50 font-semibold transition-colors">Discard</button>
                                <button onClick={handlePublish} disabled={loading} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 font-bold inline-flex items-center gap-2 transition-transform hover:scale-105">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    Publish & Create Session
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-1 bg-slate-200 rounded-full z-0"></div>

                            {lessonPlan.steps.map((step: any, index: number) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl border shadow-sm p-6 ml-14 relative z-10 hover:shadow-md transition-shadow"
                                >
                                    {/* Number Badge */}
                                    <div className="absolute -left-12 top-6 w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center ring-4 ring-white shadow-sm">
                                        {step.order}
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">{step.type}</span>
                                            <h3 className="text-xl font-bold mt-3 text-slate-800">{step.title}</h3>
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 flex justify-center items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                                            <Clock className="w-4 h-4" /> {step.durationMinutes} min
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{step.content}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
