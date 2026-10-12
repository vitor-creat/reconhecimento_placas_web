import type { PredictionRecord } from '../types';

/** Chave do localStorage onde o histórico de previsões é guardado. */
export const HISTORY_STORAGE_KEY = 'plateRecognitionHistory';

/**
 * Resultado da leitura do histórico.
 * - `unavailable`: o localStorage não pôde ser acessado (bloqueado, modo restrito etc.).
 * - `invalid`: havia dados salvos, mas JSON inválido, formato inesperado ou
 *   registros malformados (que foram descartados da leitura).
 */
export interface LoadResult {
  records: PredictionRecord[];
  problem: 'unavailable' | 'invalid' | null;
}

/** Alfabeto de saída do modelo (ver `classes` em process_lp.py). */
const PLATE_PATTERN = /^[A-Z0-9]+$/;

/**
 * Decide se a resposta do backend é uma previsão válida.
 *
 * O backend responde HTTP 200 mesmo quando não reconhece a placa, devolvendo
 * textos como "No contours found" (ou `null` se nenhuma placa é detectada).
 * Esses casos não são previsões e não devem entrar no histórico.
 */
export function parsePrediction(result: unknown): string | null {
  if (typeof result !== 'string') return null;
  const plate = result.trim();
  return PLATE_PATTERN.test(plate) ? plate : null;
}

function getStorage(): Storage | null {
  try {
    // Só o acesso a `window.localStorage` já pode lançar SecurityError.
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isPredictionRecord(value: unknown): value is PredictionRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.plate === 'string' &&
    typeof v.timestamp === 'string' &&
    !Number.isNaN(Date.parse(v.timestamp))
  );
}

/** Ordena do mais recente para o mais antigo usando o timestamp ISO. */
export function sortByNewest(records: PredictionRecord[]): PredictionRecord[] {
  return [...records].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );
}

export function loadHistory(): LoadResult {
  const storage = getStorage();
  if (!storage) return { records: [], problem: 'unavailable' };

  let raw: string | null;
  try {
    raw = storage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return { records: [], problem: 'unavailable' };
  }

  // Nada salvo ainda: situação normal, não é um problema.
  if (raw === null) return { records: [], problem: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { records: [], problem: 'invalid' };
  }

  if (!Array.isArray(parsed)) return { records: [], problem: 'invalid' };

  const valid = parsed.filter(isPredictionRecord);
  return {
    records: sortByNewest(valid),
    problem: valid.length === parsed.length ? null : 'invalid',
  };
}

/**
 * Grava o histórico completo. Retorna `true` em caso de sucesso e `false`
 * se o armazenamento estiver indisponível ou cheio (QuotaExceededError).
 */
export function saveHistory(records: PredictionRecord[]): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

/** Remove o histórico do localStorage. Retorna `false` se não foi possível. */
export function removeHistory(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback para contextos sem crypto.randomUUID (ex.: HTTP fora de localhost).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createRecord(plate: string, completedAt: Date): PredictionRecord {
  return {
    id: generateId(),
    plate,
    timestamp: completedAt.toISOString(),
  };
}

/** Formata um timestamp ISO como DD/MM/AAAA HH:mm:ss no horário local. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
