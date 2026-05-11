import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Play, Circle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  className?: string;
}

export default function AudioRecorder({ onRecordingComplete, className }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timerInterval = useRef<any>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);

      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required for voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerInterval.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      setAudioBlob(null);
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {!isRecording && !audioBlob && (
        <button 
          onClick={startRecording}
          className="p-3 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-full transition-all text-gray-500"
        >
          <Mic size={18} />
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
          <div className="flex items-center gap-2">
            <Circle size={10} className="fill-rose-500 text-rose-500 animate-ping" />
            <span className="text-[10px] font-black font-mono text-rose-500">{formatTime(recordingTime)}</span>
          </div>
          <button onClick={stopRecording} className="p-1 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
            <Square size={14} />
          </button>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="flex items-center gap-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
           <span className="text-[10px] font-black font-mono text-cyan-400">VOICE NOTE ({formatTime(recordingTime)})</span>
           <div className="flex items-center gap-2">
              <button onClick={handleDiscard} className="p-1 hover:text-rose-500 transition-all text-gray-500">
                <Trash2 size={14} />
              </button>
              <button onClick={handleSend} className="p-1.5 bg-cyan-500 text-black rounded-md hover:scale-110 transition-all">
                <Play size={10} fill="currentColor" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
