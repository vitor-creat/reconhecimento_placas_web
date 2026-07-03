import Webcam from 'react-webcam';
import styles from './Camera.module.css';

interface CameraProps {
  webcamRef: React.RefObject<Webcam | null>;
  cameraReady: boolean;
  loading: boolean;
  onReady: () => void;
  onError: () => void;
}

const videoConstraints: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
};

export function Camera({
  webcamRef,
  cameraReady,
  loading,
  onReady,
  onError,
}: CameraProps) {
  return (
    <div className={styles.wrapper}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.9}
        videoConstraints={videoConstraints}
        onUserMedia={onReady}
        onUserMediaError={onError}
        className={styles.video}
      />

      {!cameraReady && (
        <div className={styles.placeholder}>Aguardando permissão da webcam…</div>
      )}

      {loading && (
        <div className={styles.overlay}>
          <span className={styles.spinner} />
          Inferência em andamento…
        </div>
      )}
    </div>
  );
}
