import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HISTORY_STORAGE_KEY,
  createRecord,
  loadHistory,
  removeHistory,
  saveHistory,
  sortByNewest,
  type LoadResult,
} from '../services/predictionHistory';
import type { PredictionRecord } from '../types';

const WARNING_UNAVAILABLE =
  'O armazenamento local do navegador está indisponível. O histórico só ficará disponível enquanto esta página estiver aberta.';
const WARNING_INVALID =
  'Parte dos dados salvos do histórico estava inválida e foi ignorada.';
const WARNING_SAVE =
  'Não foi possível salvar o histórico no navegador (armazenamento cheio ou bloqueado). As previsões mais recentes serão perdidas ao recarregar a página.';
const WARNING_CLEAR =
  'Não foi possível apagar o histórico salvo no navegador. Ele pode reaparecer ao recarregar a página.';

function warningFor(problem: LoadResult['problem']): string | null {
  if (problem === 'unavailable') return WARNING_UNAVAILABLE;
  if (problem === 'invalid') return WARNING_INVALID;
  return null;
}

export interface UsePredictionHistoryReturn {
  /** Registros do mais recente para o mais antigo. */
  records: PredictionRecord[];
  /** Aviso sobre falhas de armazenamento (null quando está tudo certo). */
  warning: string | null;
  /** Registra uma previsão concluída com sucesso. */
  addPrediction: (plate: string, completedAt: Date) => void;
  /** Apaga todos os registros (estado e localStorage). */
  clearHistory: () => void;
}

export function usePredictionHistory(): UsePredictionHistoryReturn {
  // Leitura inicial (síncrona e sem efeitos colaterais): não gera registros.
  const [initial] = useState<LoadResult>(loadHistory);
  const [records, setRecords] = useState<PredictionRecord[]>(initial.records);
  const [warning, setWarning] = useState<string | null>(() =>
    warningFor(initial.problem)
  );

  // Espelho do estado para uso em callbacks estáveis (o loop de inferência
  // fica vivo por muito tempo e não pode capturar valores desatualizados).
  const recordsRef = useRef<PredictionRecord[]>(initial.records);

  const apply = useCallback((next: PredictionRecord[]) => {
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const addPrediction = useCallback(
    (plate: string, completedAt: Date) => {
      const record = createRecord(plate, completedAt);

      // Relê o armazenamento antes de gravar para não sobrescrever registros
      // que outra aba possa ter salvo. Se a leitura falhar, usa a memória.
      const stored = loadHistory();
      const base = stored.problem === null ? stored.records : recordsRef.current;

      const next = sortByNewest([record, ...base]);
      apply(next);
      setWarning(saveHistory(next) ? null : WARNING_SAVE);
    },
    [apply]
  );

  const clearHistory = useCallback(() => {
    apply([]);
    setWarning(removeHistory() ? null : WARNING_CLEAR);
  }, [apply]);

  // Mantém várias abas do mesmo navegador sincronizadas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // event.key === null indica localStorage.clear() em outra aba.
      if (event.key !== null && event.key !== HISTORY_STORAGE_KEY) return;
      const loaded = loadHistory();
      if (loaded.problem === 'unavailable') return;
      apply(loaded.records);
      setWarning(warningFor(loaded.problem));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [apply]);

  return { records, warning, addPrediction, clearHistory };
}
