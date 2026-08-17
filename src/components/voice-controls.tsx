"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui";

interface VoiceControlsProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
}

type RecogResult = { 0: { transcript: string }; isFinal: boolean };
type RecogEvent = { results: RecogResult[] };
type RecogInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecogEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition(): RecogInstance | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line -- vendor-prefixed Web API
  const w: any = window;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? (new Ctor() as RecogInstance) : null;
}

export function VoiceControls({ onTranscript, onListeningChange, disabled }: VoiceControlsProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<RecogInstance | null>(null);

  useEffect(() => {
    const recog = getRecognition();
    if (!recog) return;
    setSupported(true);
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-GH";
    recog.onresult = (e: RecogEvent) => {
      const last = e.results[e.results.length - 1];
      onTranscript(last[0].transcript, last.isFinal);
    };
    recog.onend = () => { setListening(false); onListeningChange?.(false); };
    recog.onerror = () => { setListening(false); onListeningChange?.(false); };
    recogRef.current = recog;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    if (!recogRef.current) return;
    if (listening) {
      recogRef.current.stop();
    } else {
      recogRef.current.start();
      setListening(true);
      onListeningChange?.(true);
    }
  }, [listening, onListeningChange]);

  if (!supported) {
    return (
      <Button disabled size="lg" variant="outline" className="rounded-full" title="Speech recognition not supported in this browser">
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      onClick={toggle}
      disabled={disabled}
      size="lg"
      variant={listening ? "destructive" : "default"}
      className="rounded-full"
      title={listening ? "Stop listening" : "Start listening"}
    >
      {listening ? (
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive-foreground/40" />
          <Mic className="relative h-5 w-5" />
        </span>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
