import { Camera } from './components/Camera/Camera';
import { Controls } from './components/Controls/Controls';
import { Status } from './components/Status/Status';
import { useInference } from './hooks/useInference';
import './App.css';

export default function App() {
  const {
    webcamRef,
    cameraReady,
    running,
    loading,
    lastPlate,
    lastConfidence,
    lastInferenceTime,
    error,
    onCameraReady,
    onCameraError,
    start,
    stop,
  } = useInference(2000);

  return (
    <div className="app">
      <header className="app__header">
        <img
          className="app__logo"
          src="/ifms-logo.png"
          alt="Instituto Federal de Mato Grosso do Sul — Campus Naviraí"
        />
        <div>
          <h1 className="app__title">Reconhecimento de Placas</h1>
          <p className="app__subtitle">Captura periódica via webcam com inferência de IA</p>
        </div>
      </header>

      <main className="app__grid">
        <section className="app__camera">
          <Camera
            webcamRef={webcamRef}
            cameraReady={cameraReady}
            loading={loading}
            onReady={onCameraReady}
            onError={onCameraError}
          />
        </section>

        <aside className="app__panel">
          <Status
            running={running}
            loading={loading}
            lastPlate={lastPlate}
            lastConfidence={lastConfidence}
            lastInferenceTime={lastInferenceTime}
            error={error}
          />
          <Controls
            running={running}
            cameraReady={cameraReady}
            onStart={start}
            onStop={stop}
          />
        </aside>
      </main>
    </div>
  );
}
