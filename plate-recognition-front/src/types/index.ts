
export interface InferenceResult {
  plate: string;
  confidence: number;
  time: Date;
}

export interface InferenceState {
  cameraReady: boolean;
  running: boolean;
  loading: boolean;
  lastPlate: string | null;
  lastConfidence: number | null;
  lastInferenceTime: Date | null;
  error: string | null;
}
