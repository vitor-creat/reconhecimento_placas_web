# Reconhecimento de Placas

Frontend em React + TypeScript que captura imagens da webcam periodicamente
e as envia para um backend de reconhecimento de placas.

## Tecnologias
- React + TypeScript
- Vite
- Axios
- react-webcam
- CSS puro

## Como executar
```bash
npm install
npm run dev
```
Abra http://localhost:5173

## Integração com backend
Ajuste a constante `API_BASE_URL` em `src/services/inference.ts`.
O endpoint espera um `POST /recognize` com `multipart/form-data`
contendo o campo `image` (JPEG) e deve responder:
```json
{ "plate": "ABC1D23", "confidence": 0.95 }
```

## Detalhes do fluxo
- Não usa `setInterval`. A captura roda em um loop assíncrono
  (`while`) no hook `useInference`, que aguarda cada resposta antes
  de capturar o próximo frame — evitando requisições concorrentes.
- O botão "Parar" encerra o loop imediatamente via `runningRef`.
