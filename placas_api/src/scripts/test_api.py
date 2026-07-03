import requests

# 1. Defina a URL pública do seu Space
# Formato padrão: https://<seu-usuario>-<nome-do-space>.hf.space/predict
API_URL = "http://localhost:5000/predict"
# API_URL = "https://thinness-lanky-underdone.ngrok-free.dev/predict"

# 2. Caminho da imagem local que você quer enviar para o modelo
caminho_imagem = "/home/vitor/Documentos/placas_api/images.jpeg"

def classificar_imagem(caminho):
    try:
        # O arquivo precisa ser lido em modo binário (rb)
        with open(caminho, "rb") as arquivo_imagem:
            
            # O dicionário 'files' mapeia o nome do parâmetro esperado pelo FastAPI ("file")
            # para uma tupla contendo o nome do arquivo, os dados binários e o tipo MIME
            payload = {
                "file": (caminho, arquivo_imagem, "image/jpeg")
            }
            
            print(f"Enviando {caminho} para a API...")
            
            # Fazendo a requisição POST
            response = requests.post(API_URL, files=payload)
            
            # Levanta uma exceção se o status HTTP não for 200 (OK)
            response.raise_for_status()
            
            # O FastAPI retorna automaticamente um JSON, que o requests já converte para dicionário
            resultado = response.json()
            return resultado

    except requests.exceptions.RequestException as e:
        print(f"Erro na comunicação com a API: {e}")
        if response is not None:
             print(f"Detalhes do erro: {response.text}")
        return None

# Executando a chamada
resposta_api = classificar_imagem(caminho_imagem)

if resposta_api:
    print("Sucesso! Resultado retornado:")
    print(resposta_api)