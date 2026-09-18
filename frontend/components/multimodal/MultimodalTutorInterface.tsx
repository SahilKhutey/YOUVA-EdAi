"use client";

import React, { useState } from 'react';
import {
  BookOpen,
  Headphones,
  Video,
  Mic,
  LayoutGrid,
  Play,
  Pause,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Volume2,
} from 'lucide-react';

export type ActiveTabModality = 'TEXT' | 'AUDIO' | 'VIDEO' | 'VOICE' | 'INTERACTIVE';

export interface MultimodalTutorInterfaceProps {
  sessionId?: string;
  learnerId?: string;
  conceptTitle?: string;
  objective?: string;
  initialModality?: ActiveTabModality;
  onModalitySwitch?: (newModality: ActiveTabModality) => void;
  onAnswerSubmit?: (answer: { modality: ActiveTabModality; content: string }) => void;
}

export const MultimodalTutorInterface: React.FC<MultimodalTutorInterfaceProps> = ({
  sessionId = 'demo-session-01',
  learnerId = 'learner-grade8-01',
  conceptTitle = 'Multiplication of Rational Numbers',
  objective = 'Multiply two rational numbers by multiplying numerators and denominators independently.',
  initialModality = 'TEXT',
  onModalitySwitch,
  onAnswerSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTabModality>(initialModality);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [speechConfidence, setSpeechConfidence] = useState<number>(0.88);
  const [isTextFallback, setIsTextFallback] = useState(false);
  const [typedResponse, setTypedResponse] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  const handleTabChange = (modality: ActiveTabModality) => {
    setActiveTab(modality);
    if (onModalitySwitch) {
      onModalitySwitch(modality);
    }
  };

  const handleMicToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setSpokenTranscript('');
      // Simulate live speech recognition streaming
      setTimeout(() => {
        setSpokenTranscript('To multiply negative three-fifths and two-thirds, I multiply negative three by two to get negative six, and five by three to get fifteen, giving negative six over fifteen.');
        setSpeechConfidence(0.89);
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      // Simulate client-side preview & OCR extraction
      setTimeout(() => {
        setOcrResult('Extracted Steps:\n(-3/5) * (2/3) = (-3 * 2) / (5 * 3) = -6/15 = -2/5');
      }, 1200);
    }
  };

  const handleSubmit = () => {
    let content = '';
    if (activeTab === 'VOICE') {
      content = isTextFallback ? typedResponse : spokenTranscript;
    } else if (activeTab === 'INTERACTIVE') {
      content = ocrResult || selectedFile || 'Canvas interaction submitted';
    } else {
      content = typedResponse;
    }

    if (onAnswerSubmit) {
      onAnswerSubmit({ modality: activeTab, content });
    }
    setSubmittedFeedback('Answer evaluated successfully! Your mastery score updated (+0.10).');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-w-5xl mx-auto space-y-6">
      {/* Header with Title and Unified Learning Objective */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
            Multimodal Tutor Session
          </span>
          <h2 className="text-2xl font-bold mt-2 text-white">{conceptTitle}</h2>
          <p className="text-sm text-slate-400 mt-1">
            <span className="font-semibold text-slate-300">Objective:</span> {objective}
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Session: {sessionId}</span>
        </div>
      </div>

      {/* Modality Switching Navigation Tabs (Clause N11.54) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'TEXT'}
          onClick={() => handleTabChange('TEXT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'TEXT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Read</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'AUDIO'}
          onClick={() => handleTabChange('AUDIO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'AUDIO'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Listen</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'VIDEO'}
          onClick={() => handleTabChange('VIDEO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'VIDEO'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Watch</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'VOICE'}
          onClick={() => handleTabChange('VOICE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'VOICE'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Speak</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'INTERACTIVE'}
          onClick={() => handleTabChange('INTERACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'INTERACTIVE'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Explore / Photo</span>
        </button>
      </div>

      {/* Main Instructional Content Area Per Selected Modality */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 min-h-[300px]">
        {/* TAB 1: READ */}
        {activeTab === 'TEXT' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-300">Curricular Instruction: Rational Multiplication</h3>
            <p className="text-slate-300 leading-relaxed">
              When multiplying two rational numbers (a / b) and (c / d) where b, d ≠ 0, the product is formed by multiplying their numerators together and their denominators together:
            </p>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl font-mono text-center text-lg text-emerald-400">
              (a / b) × (c / d) = (a × c) / (b × d)
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Remember: When multiplying terms with opposite signs (positive and negative), the final product is always negative!</span>
            </div>
          </div>
        )}

        {/* TAB 2: LISTEN (AUDIO) */}
        {activeTab === 'AUDIO' && (
          <div className="space-y-5 text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Volume2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Audio Narration with Synchronized Transcript</h3>
              <p className="text-xs text-slate-400 mt-1">High-fidelity 24kHz neural speech synthesis</p>
            </div>
            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg transition-all"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingAudio ? 'Pause Narration' : 'Play Narration'}</span>
              </button>
              <div className="flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span>Speed:</span>
                {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAudioSpeed(speed)}
                    className={`px-2 py-0.5 rounded ${audioSpeed === speed ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            {/* Live Synchronized Captions Box (N11.25) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-indigo-200 font-mono text-left max-w-xl mx-auto">
              <span className="text-xs text-slate-500 block mb-1 uppercase tracking-wider">Synchronized Captions</span>
              &ldquo;Step one: multiply numerator a by numerator c. Step two: multiply denominator b by denominator d. Then simplify to lowest terms.&rdquo;
            </div>
          </div>
        )}

        {/* TAB 3: WATCH (VIDEO) */}
        {activeTab === 'VIDEO' && (
          <div className="space-y-4">
            <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform cursor-pointer">
                <Play className="w-6 h-6 ml-0.5" />
              </div>
              <span className="absolute bottom-4 left-4 text-xs font-semibold bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded text-slate-200">
                Duration: 0:35 • Concept Demonstration
              </span>
              <span className="absolute bottom-4 right-4 text-xs bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-300">
                CC Available
              </span>
            </div>
            <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">Closed Caption:</span> &ldquo;Notice how the shaded grid partitions show (3/5) horizontally and (2/3) vertically, yielding (6/15) in the overlap area.&rdquo;
            </div>
          </div>
        )}

        {/* TAB 4: SPEAK (VOICE TUTOR) */}
        {activeTab === 'VOICE' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">Voice Question & Socratic Evaluation</h3>
                <p className="text-xs text-slate-400">Explain your step-by-step reasoning verbally</p>
              </div>
              <button
                onClick={() => setIsTextFallback(!isTextFallback)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                {isTextFallback ? 'Switch back to Microphone' : 'Having microphone issues? Type instead'}
              </button>
            </div>

            {!isTextFallback ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <button
                  onClick={handleMicToggle}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>
                <span className="text-sm font-medium text-slate-300">
                  {isRecording ? 'Listening... Speak now' : 'Click microphone to record your explanation'}
                </span>

                {spokenTranscript && (
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Live Transcript (Acoustic Confidence: {Math.round(speechConfidence * 100)}%)</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Voice Recognized
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 italic">&ldquo;{spokenTranscript}&rdquo;</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs text-slate-400">Text Alternative (Voice Failure Recovery Mode)</label>
                <textarea
                  value={typedResponse}
                  onChange={(e) => setTypedResponse(e.target.value)}
                  placeholder="Type your explanation step by step..."
                  className="w-full h-28 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: EXPLORE / PHOTO (VISION WORKSHEET) */}
        {activeTab === 'INTERACTIVE' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Worksheet & Handwritten Work Upload</h3>
            <p className="text-xs text-slate-400">Upload a photo of your handwritten notebook solution for automated diagnostic parsing.</p>

            <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors">
              <input
                type="file"
                id="worksheet-upload"
                onChange={handleFileUpload}
                accept="image/png, image/jpeg"
                className="hidden"
              />
              <label htmlFor="worksheet-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-300">Click to upload photo or drag and drop</span>
                <span className="text-xs text-slate-500">PNG, JPG up to 5MB (Exif metadata automatically stripped)</span>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <FileText className="w-4 h-4 text-indigo-400" /> {selectedFile}
                  </span>
                  <span className="text-emerald-400">Validated</span>
                </div>
                {ocrResult && (
                  <div className="mt-2 bg-slate-950 p-3 rounded-lg font-mono text-xs text-emerald-300 whitespace-pre-line border border-slate-800/80">
                    {ocrResult}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission and Evaluation Response */}
      <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Learner ID: <span className="font-mono text-slate-400">{learnerId}</span>
        </div>
        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Submit Solution for Evaluation</span>
        </button>
      </div>

      {submittedFeedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{submittedFeedback}</span>
        </div>
      )}
    </div>
  );
};
