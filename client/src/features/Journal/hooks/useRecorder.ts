import { useCallback, useEffect, useRef, useState } from "react";

interface UseRecorderResult {
  recording: boolean;
  /** Seconds since recording started. */
  elapsed: number;
  error: string | null;
  start: () => Promise<void>;
  /** Stops and resolves with the recorded audio (null if nothing captured). */
  stop: () => Promise<Blob | null>;
}

/** Microphone capture via the browser's MediaRecorder (webm/opus, mp4 on Safari). */
export const useRecorder = (): UseRecorderResult => {
  const [recording, setRecording] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = useCallback(() => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    recorder.current = null;
    setRecording(false);
  }, []);

  // Don't leave the mic on if the view unmounts mid-recording.
  useEffect(() => release, [release]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.start();
      recorder.current = rec;
      setElapsed(0);
      setRecording(true);
      const startedAt = Date.now();
      ticker.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
        500
      );
    } catch {
      setError("Microphone unavailable. Check the browser's mic permission.");
    }
  }, []);

  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorder.current;
        if (!rec) return resolve(null);
        rec.onstop = () => {
          // Some browsers label mic-only recordings "video/webm"/"video/mp4" or
          // leave the type empty; the server and Gemini want an audio/* type.
          const type =
            rec.mimeType.split(";")[0].replace(/^video\//, "audio/") ||
            "audio/webm";
          const blob = new Blob(chunks.current, { type });
          release();
          resolve(blob.size ? blob : null);
        };
        rec.stop();
      }),
    [release]
  );

  return { recording, elapsed, error, start, stop };
};
