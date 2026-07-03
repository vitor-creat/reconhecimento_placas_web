import axios from 'axios';


const API_BASE_URL = 'http://localhost:5000';
const RECOGNIZE_ENDPOINT = `${API_BASE_URL}/predict`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
});

/**
 * Envia um frame da webcam para o backend de reconhecimento de placas.
 * Recebe um Blob JPEG e retorna a placa reconhecida.
 */
export async function recognizePlate(
  image: Blob
) {
  const formData = new FormData();
  formData.append('file', image, "placa.jpg");

  const {data} = await api.post<string>(
    RECOGNIZE_ENDPOINT,
    formData,
  );

  return data;
}
