
export interface InferenceResult {
  plate: string;
  confidence: number;
  time: Date;
}

/**
 * Registro do histórico de previsões, persistido no localStorage.
 * O backend devolve apenas o texto da placa (sem confiança), então só
 * guardamos o que de fato está disponível.
 */
export interface PredictionRecord {
  /** Identificador único do registro. */
  id: string;
  /** Texto previsto pelo modelo (ex.: "ABC1D23"). */
  plate: string;
  /** Momento em que a previsão foi concluída, em ISO 8601 (UTC). */
  timestamp: string;
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
