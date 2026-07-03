import { useCallback, useRef, useState } from 'react';
import type Webcam from 'react-webcam';
import { recognizePlate } from '../services/inference';
import type { InferenceState } from '../types';

const CAPTURE_INTERVAL_MS = 2000;

/**
 * Converte uma dataURL (base64) retornada pela react-webcam em Blob JPEG.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface UseInferenceReturn extends InferenceState {
  webcamRef: React.RefObject<Webcam | null>;
  onCameraReady: () => void;
  onCameraError: () => void;
  start: () => void;
  stop: () => void;
}

export function useInference(
  intervalMs: number = CAPTURE_INTERVAL_MS
): UseInferenceReturn {
  const webcamRef = useRef<Webcam | null>(null);
  const runningRef = useRef(false);

  const [state, setState] = useState<InferenceState>({
    cameraReady: false,
    running: false,
    loading: false,
    lastPlate: null,
    lastConfidence: null,
    lastInferenceTime: null,
    error: null,
  });

  const patch = useCallback((partial: Partial<InferenceState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const captureFrame = useCallback((): Blob | null => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) return null;
    return dataUrlToBlob(shot);
  }, []);

  const onCameraReady = useCallback(() => patch({ cameraReady: true }), [patch]);
  const onCameraError = useCallback(
    () => patch({ cameraReady: false, error: 'Não foi possível acessar a webcam.' }),
    [patch]
  );

  const loop = useCallback(async () => {
    while (runningRef.current) {
      const frame = captureFrame();

      if (!frame) {
        patch({ error: 'Falha ao capturar frame da webcam.' });
        await delay(intervalMs);
        continue;
      }

      patch({ loading: true, error: null });

      try {
        const result = await recognizePlate(frame);
        // Verifica novamente: usuário pode ter parado durante o await.
        if (!runningRef.current) break;
        patch({
          loading: false,
          lastPlate: result,
          lastInferenceTime: new Date(),
        });
      } catch {
        if (!runningRef.current) break;
        patch({ loading: false, error: 'Erro ao comunicar com a API.' });
      }

      if (!runningRef.current) break;
      await delay(intervalMs);
    }

    patch({ loading: false });
  }, [captureFrame, intervalMs, patch]);

  const start = useCallback(() => {
    if (runningRef.current || !state.cameraReady) return;
    runningRef.current = true;
    patch({ running: true, error: null });
    void loop();
  }, [loop, patch, state.cameraReady]);

  const stop = useCallback(() => {
    runningRef.current = false;
    patch({ running: false, loading: false });
  }, [patch]);

  return {
    ...state,
    webcamRef,
    onCameraReady,
    onCameraError,
    start,
    stop,
  };
}
