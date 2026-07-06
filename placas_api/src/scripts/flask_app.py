from flask import Flask, jsonify, request
from flask_cors import CORS
# from pyngrok import ngrok

import io
from PIL import Image
import torchvision.transforms as transforms

from process_lp import process_license_plate

app = Flask(__name__)
CORS(app)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# Exemplo de rota para o seu modelo PyTorch
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo encontrado com a chave 'file'"}), 400
        
    arquivo = request.files['file']
    
    if arquivo.filename == '':
        return jsonify({"error": "Arquivo sem nome válido"}), 400

    try:
        # 1. Ler os bytes da imagem diretamente da memória (sem salvar no disco)
        img_bytes = arquivo.read()
        imagem = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        result = process_license_plate(imagem)
        
        # return jsonify({
        #    "status": "SUCESS", 
        #    "placa": result,
        # })
        print(result)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"Erro ao processar imagem: {str(e)}"}), 500

if __name__ == '__main__':
    # Roda o Flask localmente na porta 5000
    app.run(port=5000)
