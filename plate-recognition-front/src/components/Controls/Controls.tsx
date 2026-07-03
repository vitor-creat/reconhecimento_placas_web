interface ControlsProps {
  running: boolean;
  cameraReady: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function Controls({ running, cameraReady, onStart, onStop }: ControlsProps) {
  return (
    <div className="controls">
      <button
        className="btn btn--start"
        onClick={onStart}
        disabled={running || !cameraReady}
      >
        Iniciar Inferência
      </button>
      <button
        className="btn btn--stop"
        onClick={onStop}
        disabled={!running}
      >
        Parar
      </button>
    </div>
  );
}
