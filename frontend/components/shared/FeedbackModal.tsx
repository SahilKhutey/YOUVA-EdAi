'use client';
import { useState } from 'react';
import { Star, MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId?: string;
    context: string;
    title?: string;
    subtitle?: string;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    sessionId,
    context,
    title = "How was your session?",
    subtitle = "Your feedback helps the AI improve its teaching."
}: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rating, comments, context, sessionId })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setRating(0);
                    setComments('');
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-90" />
                            <h2 className="text-2xl font-extrabold mb-1">{title}</h2>
                            <p className="text-indigo-200 text-sm font-medium">{subtitle}</p>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                            {success ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Thank You!</h3>
                                    <p className="text-slate-500">Your feedback has been securely submitted.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center gap-2 mb-8">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHovered(star)}
                                                onMouseLeave={() => setHovered(0)}
                                                className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    className={`w-10 h-10 ${star <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Additional Comments (Optional)</label>
                                        <textarea
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            rows={3}
                                            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none font-medium text-slate-700"
                                            placeholder="What did you like? What could be better?"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={rating === 0 || submitting}
                                        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Feedback'} <Send className="w-4 h-4 ml-1" />
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
