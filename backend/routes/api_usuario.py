# backend/routes/api_usuario.py

from flask import Blueprint, jsonify, request
from http import HTTPStatus
from ..app import supabase

# Define o Blueprint para rotas do usuário (acesso restrito)
api_usuario = Blueprint('api_usuario', __name__, url_prefix='/api/usuario')

# NOTA: Estas rotas geralmente seriam protegidas com JWT ou sessões,
# mas no contexto do Supabase, o frontend lida com a autenticação e envia o token
# de sessão nas chamadas. Aqui no backend, apenas expomos o endpoint CRUD.

# --- ROTA: CRUD de Pets ---
@api_usuario.route('/pets', methods=['GET', 'POST'])
def pets_usuario():
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
    
    # Esta rota precisa do ID do cliente. Assumimos que o frontend envia o 'id_tutor' no GET params
    # ou no corpo do POST (ou que o token JWT é validado e o ID é extraído do token).
    # Por simplicidade, assumimos que o ID do tutor é enviado (para GET) ou está no corpo (para POST).

    if request.method == 'GET':
        cliente_id = request.args.get('cliente_id') # Exemplo: /api/usuario/pets?cliente_id=UUID_AQUI
        if not cliente_id: return jsonify({"error": "ID do cliente é obrigatório."}), HTTPStatus.BAD_REQUEST
        try:
            res = supabase.table('pets').select('*').eq('id_tutor', cliente_id).order('nome_pet').execute()
            return jsonify(res.data), HTTPStatus.OK
        except Exception:
            return jsonify({"error": "Falha ao listar pets."}), HTTPStatus.INTERNAL_SERVER_ERROR

    if request.method == 'POST':
        dados = request.get_json()
        if not dados: return jsonify({"error": "Corpo JSON vazio."}), HTTPStatus.BAD_REQUEST
        # Assumindo que 'id_tutor' está no corpo dos dados (dados['id_tutor'])
        try:
            res = supabase.table('pets').insert(dados).execute()
            return jsonify(res.data), HTTPStatus.CREATED
        except Exception:
            return jsonify({"error": "Falha ao inserir pet."}), HTTPStatus.INTERNAL_SERVER_ERROR
            
# --- ROTA: Atualizar/Deletar Pet por ID ---
@api_usuario.route('/pets/<int:pet_id>', methods=['PUT', 'DELETE'])
def pet_por_id(pet_id):
    if not supabase: return jsonify({"error": "DB indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE

    if request.method == 'PUT':
        dados = request.get_json()
        try:
            res = supabase.table('pets').update(dados).eq('id_pet', pet_id).execute()
            return jsonify(res.data), HTTPStatus.OK
        except Exception:
            return jsonify({"error": "Falha ao atualizar pet."}), HTTPStatus.INTERNAL_SERVER_ERROR
    
    if request.method == 'DELETE':
        try:
            supabase.table('pets').delete().eq('id_pet', pet_id).execute()
            return jsonify({"message": "Pet deletado."}), HTTPStatus.NO_CONTENT
        except Exception:
            return jsonify({"error": "Falha ao deletar pet."}), HTTPStatus.INTERNAL_SERVER_ERROR