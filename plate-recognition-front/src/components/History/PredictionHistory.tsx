import { useState } from 'react';
import { formatDateTime } from '../../services/predictionHistory';
import type { PredictionRecord } from '../../types';

interface PredictionHistoryProps {
  records: PredictionRecord[];
  warning: string | null;
  onClear: () => void;
}

export function PredictionHistory({
  records,
  warning,
  onClear,
}: PredictionHistoryProps) {
  const [confirming, setConfirming] = useState(false);
  const count = records.length;

  const handleConfirm = () => {
    onClear();
    setConfirming(false);
  };

  return (
    <section className="history" aria-labelledby="history-title">
      <div className="history__header">
        <div>
          <h2 id="history-title" className="history__title">
            Histórico de previsões
          </h2>
          <p className="history__count">
            {count === 1 ? '1 registro' : `${count} registros`}
          </p>
        </div>

        {confirming ? (
          <div className="history__confirm" role="group" aria-label="Confirmar exclusão">
            <span className="history__confirm-text">
              Apagar {count === 1 ? 'o registro' : `os ${count} registros`}?
            </span>
            <button
              type="button"
              className="history__btn history__btn--danger"
              onClick={handleConfirm}
            >
              Apagar
            </button>
            <button
              type="button"
              className="history__btn"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="history__btn history__btn--outline-danger"
            onClick={() => setConfirming(true)}
            disabled={count === 0}
          >
            Limpar histórico
          </button>
        )}
      </div>

      {warning && (
        <div className="history__warning" role="alert">
          {warning}
        </div>
      )}

      {count === 0 ? (
        <p className="history__empty">
          Nenhuma previsão registrada ainda. Inicie a inferência para que os
          resultados apareçam aqui.
        </p>
      ) : (
        <ol className="history__list">
          {records.map((record) => (
            <li key={record.id} className="history__item">
              <span className="history__plate">{record.plate}</span>
              <time className="history__time" dateTime={record.timestamp}>
                {formatDateTime(record.timestamp)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
