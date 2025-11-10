from flask import Blueprint, jsonify, request
from http import HTTPStatus
# Importa as funções que corrigimos do controller
from ..controllers.agendamento_controller import calcular_horarios_disponiveis, criar_novo_agendamento
# Importa o objeto Supabase (assumindo que ele é inicializado no app.py)
from ..app import supabase 

api_agendamento = Blueprint('api_agendamento', __name__, url_prefix='/api')

# --- ROTA: Horários Disponíveis (GET) ---
@api_agendamento.route('/horarios-disponiveis', methods=['GET'])
def horarios_disponiveis():
    """ Rota para buscar horários disponíveis. """
    if not supabase:
         return jsonify({"error": "Erro interno: Conexão com banco de dados indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE

    try:
        # Validação dos parâmetros
        loja_id = int(request.args.get('loja_id'))
        servico_id = int(request.args.get('servico_id'))
        data_str = request.args.get('data')
        
        if not all([loja_id, servico_id, data_str]):
            return jsonify({"error": "Parâmetros incompletos (loja_id, servico_id, data)."}), HTTPStatus.BAD_REQUEST

        horarios = calcular_horarios_disponiveis(supabase, loja_id, servico_id, data_str)
        
        return jsonify(horarios), HTTPStatus.OK

    except ValueError as e:
        # Captura erro de data inválida ou parsing
        return jsonify({"error": f"Parâmetros inválidos: {e}"}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        print(f"ERRO em /horarios-disponiveis: {e}")
        return jsonify({"error": "Erro interno ao calcular horários."}), HTTPStatus.INTERNAL_SERVER_ERROR


# --- ROTA: Criar Agendamento (POST) ---
@api_agendamento.route('/agendar', methods=['POST'])
def agendar():
    """ Rota para criar um novo agendamento. """
    if not supabase:
         return jsonify({"error": "Erro interno: Conexão com banco de dados indisponível."}), HTTPStatus.SERVICE_UNAVAILABLE
         
    data = request.get_json()
    if not data:
        return jsonify({"error": "Requisição sem corpo JSON."}), HTTPStatus.BAD_REQUEST

    try:
        agendamento_criado = criar_novo_agendamento(supabase, data)
        
        return jsonify({
            "message": "Agendamento criado com sucesso!", 
            "agendamento": agendamento_criado
        }), HTTPStatus.CREATED

    except ValueError as e:
        # Erro de negócio (ex: slot ocupado, dados faltando)
        return jsonify({"error": str(e)}), HTTPStatus.CONFLICT # 409 Conflict é bom para slot ocupado
    except Exception as e:
        # Erros internos, DB, etc.
        print(f"ERRO em /agendar: {e}")
        return jsonify({"error": "Erro interno ao processar agendamento."}), HTTPStatus.INTERNAL_SERVER_ERROR