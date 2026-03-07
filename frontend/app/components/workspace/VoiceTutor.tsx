'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface VoiceTutorProps {
  topicId: string;
  topicTitle: string;
}

interface ChatMessage {
  role: 'user' | 'tutor';
  content: string;
}

export function VoiceTutor({ topicId, topicTitle }: VoiceTutorProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Speech & UI State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for Web Speech API
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev ? prev + ' ' + transcript : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInputText('');
      recognitionRef.current?.start();
      setIsListening(true);
      // Stop any current speech when user starts talking
      if (synthesisRef.current) synthesisRef.current.cancel();
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current || isMuted) return;

    // Use a natural sounding voice if available
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesisRef.current.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Female'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.pitch = 1.1;
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const formatHistory = () => {
    return messages.map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai-mentor/chat', {
        topicId,
        topicTitle,
        message: userMessage,
        history: formatHistory(),
      });

      const tutorMessage = res.data.message;
      setMessages((prev) => [...prev, { role: 'tutor', content: tutorMessage }]);

      speakText(tutorMessage);
    } catch (error) {
      console.error('Error chatting with tutor:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'tutor', content: "I'm having trouble connecting to my central knowledge. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] shadow-2xl border-none bg-white rounded-3xl overflow-hidden mt-6 ring-1 ring-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 p-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {isSpeaking && (
              <div className="absolute -top-1 -right-1 flex gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-white text-lg tracking-tight">AI Voice Tutor</h3>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{topicTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && synthesisRef.current) synthesisRef.current.cancel();
            }}
            className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${isMuted ? 'bg-white/10 text-white/50' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 bg-indigo-50 rounded-[40px] flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-indigo-200" />
            </div>
            <h4 className="font-black text-slate-800 text-xl mb-2">Hello, {user?.name?.split(' ')[0] || 'Scholar'}!</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              I'm your personalized AI mentor. Speak or type a question about <span className="text-primary font-bold">{topicTitle}</span> to get started.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}
            >
              <div
                className={`max-w-[85%] rounded-[28px] px-6 py-4 shadow-sm border ${msg.role === 'user'
                  ? 'bg-primary text-white border-primary shadow-primary/20 rounded-tr-none'
                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-none font-medium'
                  }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border-slate-100 rounded-full px-6 py-4 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end gap-3 bg-slate-50 rounded-[32px] p-2 border shadow-inner">
          <button
            type="button"
            onClick={toggleListening}
            className={`shrink-0 h-12 w-12 rounded-full inline-flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-100' : 'bg-white text-slate-400 hover:text-primary shadow-sm'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-h-[48px] flex items-center">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening closely..." : "Message your tutor..."}
              className="w-full resize-none py-3 px-4 rounded-3xl text-sm border-none bg-transparent focus:ring-0 placeholder:text-slate-400 font-medium"
              rows={1}
            />
          </div>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="shrink-0 h-12 w-12 rounded-full inline-flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
