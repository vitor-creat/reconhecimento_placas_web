interface StatusProps {
  running: boolean;
  loading: boolean;
  lastPlate: string | null;
  lastConfidence: number | null;
  lastInferenceTime: Date | null;
  error: string | null;
}

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('pt-BR');
}

function formatConfidence(value: number | null): string {
  if (value == null) return '';
  return ` (${(value * 100).toFixed(1)}%)`;
}

export function Status({
  running,
  loading,
  lastPlate,
  lastConfidence,
  lastInferenceTime,
  error,
}: StatusProps) {
  return (
    <div className="status">
      <div className="status__row">
        <span className="status__label">Status</span>
        <span className={`badge ${running ? 'badge--on' : 'badge--off'}`}>
          {running ? (loading ? 'Executando (processando…)' : 'Executando') : 'Parado'}
        </span>
      </div>

      <div className="status__row">
        <span className="status__label">Última placa</span>
        <span className="status__value status__value--plate">
          {lastPlate ? lastPlate + formatConfidence(lastConfidence) : '—'}
        </span>
      </div>

      <div className="status__row">
        <span className="status__label">Última inferência</span>
        <span className="status__value">{formatTime(lastInferenceTime)}</span>
      </div>

      {error && <div className="status__error">{error}</div>}
    </div>
  );
}
