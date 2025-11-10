# backend/routes/api_ecommerce.py

from flask import Blueprint, jsonify
from http import HTTPStatus
from ..app import supabase
from ..controllers import recomendacao_controller
from ..controllers import produto_controller 

api_ecommerce = Blueprint('api_ecommerce', __name__, url_prefix='/api/ecommerce')

# --- Rotas de Consulta (Home) ---
@api_ecommerce.route('/ofertas', methods=['GET'])
def get_ofertas():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    try:
        ofertas = recomendacao_controller.buscar_ofertas(supabase)
        return jsonify(ofertas), HTTPStatus.OK
    except Exception:
        return jsonify({"error": "Falha ao carregar ofertas."}), HTTPStatus.INTERNAL_SERVER_ERROR

@api_ecommerce.route('/novidades', methods=['GET'])
def get_novidades():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    try:
        novidades = recomendacao_controller.buscar_novidades(supabase, limite=8)
        return jsonify(novidades), HTTPStatus.OK
    except Exception:
        return jsonify({"error": "Falha ao carregar novidades."}), HTTPStatus.INTERNAL_SERVER_ERROR

@api_ecommerce.route('/mais-vendidos', methods=['GET'])
def get_mais_vendidos():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    try:
        mais_vendidos = recomendacao_controller.buscar_mais_vendidos(supabase, limite=12) 
        return jsonify(mais_vendidos), HTTPStatus.OK
    except Exception:
        return jsonify({"error": "Falha ao carregar mais vendidos."}), HTTPStatus.INTERNAL_SERVER_ERROR

@api_ecommerce.route('/recomendados', methods=['GET'])
def get_recomendados():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    try:
        recomendados = recomendacao_controller.buscar_novidades(supabase, limite=8)
        return jsonify(recomendados), HTTPStatus.OK
    except Exception:
        return jsonify({"error": "Falha ao carregar recomendados."}), HTTPStatus.INTERNAL_SERVER_ERROR

# --- Rota: Produtos por ID (Detalhe da Página de Produto) ---
@api_ecommerce.route('/produtos/<int:produto_id>', methods=['GET'])
def get_produto_por_id(produto_id):
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    try:
        produto = produto_controller.buscar_produto_por_id(supabase, produto_id)
        if not produto:
             return jsonify({"error": "Produto não encontrado."}), HTTPStatus.NOT_FOUND
        return jsonify(produto), HTTPStatus.OK
    except Exception:
        return jsonify({"error": "Falha ao buscar produto."}), HTTPStatus.INTERNAL_SERVER_ERROR