'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface VoiceTutorProps {
  topicId: string;
  topicTitle: string;
}

interface ChatMessage {
  role: 'user' | 'tutor';
  content: string;
}

export function VoiceTutor({ topicId, topicTitle }: VoiceTutorProps) {
  const { data: session } = useSession();
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

    // Optional: Could adjust pitch/rate based on cognitiveLevel received from backend
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const formatHistory = () => {
    return messages.map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !(session as any)?.accessToken) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          topicId,
          topicTitle,
          message: userMessage,
          history: formatHistory(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch AI response');

      const data = await response.json();

      const newMessages = [...messages, { role: 'user', content: userMessage }, { role: 'tutor' as const, content: data.message }];
      setMessages(newMessages as any);

      speakText(data.message);
    } catch (error) {
      console.error('Error chatting with tutor:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'tutor', content: 'Connection error. I could not reach my brain right now.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] shadow-sm border bg-white rounded-xl overflow-hidden mt-6">
      <div className="bg-primary/5 border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span>🧠 AI Mentor</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && synthesisRef.current) synthesisRef.current.cancel();
          }}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted h-9 w-9 ${isMuted ? 'text-muted-foreground' : 'text-primary'}`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <Mic className="w-8 h-8 opacity-20" />
            <p className="text-sm">Ask me anything about {topicTitle}!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 border text-foreground'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted/50 border rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-slate-50 flex items-end gap-2">
        <button
          type="button"
          onClick={toggleListening}
          className={`shrink-0 h-[42px] w-[42px] rounded-full inline-flex items-center justify-center text-sm font-medium transition-colors ${isListening ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isListening ? "Listening..." : "Type or speak your question..."}
            className="flex min-h-[42px] h-[42px] max-h-[120px] w-full resize-none py-3 px-4 rounded-xl text-sm border bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          className="shrink-0 h-[42px] rounded-xl px-4 inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
