# backend/routes/api_admin.py

from flask import Blueprint, jsonify, request
from http import HTTPStatus
from ..app import supabase
from ..controllers import produto_controller
# Importe outros controllers de administração conforme forem criados (ex: horario_controller)

# Define o Blueprint para as rotas administrativas
api_admin = Blueprint('api_admin', __name__, url_prefix='/api/admin')

# --- Middleware de Autenticação (FUTURO: ADICIONAR VERIFICAÇÃO DE ROLE) ---
# Você precisaria de um decorador aqui para garantir que SÓ ADMINs acessem.
# Por enquanto, deixamos aberto para facilitar o teste.

# --- ROTA: Produtos (Listar/Inserir) ---
@api_admin.route('/produtos', methods=['GET', 'POST'])
def produtos_admin():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    
    if request.method == 'GET':
        try:
            produtos = produto_controller.listar_produtos(supabase)
            return jsonify(produtos), HTTPStatus.OK
        except Exception:
            return jsonify({"error": "Falha ao listar produtos."}), HTTPStatus.INTERNAL_SERVER_ERROR
    
    if request.method == 'POST':
        dados = request.get_json()
        if not dados: return jsonify({"error": "Corpo JSON vazio."}), HTTPStatus.BAD_REQUEST
        try:
            produto_inserido = produto_controller.inserir_produto(supabase, dados)
            return jsonify(produto_inserido), HTTPStatus.CREATED
        except Exception:
            return jsonify({"error": "Falha ao inserir produto."}), HTTPStatus.INTERNAL_SERVER_ERROR

# --- ROTA: Produtos (Buscar/Atualizar/Deletar por ID) ---
@api_admin.route('/produtos/<int:produto_id>', methods=['GET', 'PUT', 'DELETE'])
def produto_por_id_admin(produto_id):
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE

    if request.method == 'GET':
        try:
            produto = produto_controller.buscar_produto_por_id(supabase, produto_id)
            if not produto:
                return jsonify({"error": "Produto não encontrado."}), HTTPStatus.NOT_FOUND
            return jsonify(produto), HTTPStatus.OK
        except Exception:
            return jsonify({"error": "Falha ao buscar produto."}), HTTPStatus.INTERNAL_SERVER_ERROR

    if request.method == 'PUT':
        dados = request.get_json()
        if not dados: return jsonify({"error": "Corpo JSON vazio."}), HTTPStatus.BAD_REQUEST
        try:
            produto_atualizado = produto_controller.atualizar_produto(supabase, produto_id, dados)
            return jsonify(produto_atualizado), HTTPStatus.OK
        except Exception:
            return jsonify({"error": "Falha ao atualizar produto."}), HTTPStatus.INTERNAL_SERVER_ERROR

    if request.method == 'DELETE':
        try:
            produto_controller.deletar_produto(supabase, produto_id)
            return jsonify({"message": "Produto deletado com sucesso."}), HTTPStatus.NO_CONTENT
        except Exception:
            return jsonify({"error": "Falha ao deletar produto."}), HTTPStatus.INTERNAL_SERVER_ERROR