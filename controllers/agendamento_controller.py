from datetime import datetime, time, timedelta, timezone
from supabase import Client

# --- Constantes e Configurações ---
HORA_INICIO_PADRAO = time(9, 0)  # 09:00
HORA_FIM_PADRAO = time(18, 0)    # 18:00
INTERVALO_SLOT_MINUTOS = 30      # A "grade" do calendário (slots de 30 em 30 min)

def calcular_horarios_disponiveis(supabase: Client, loja_id: int, servico_id: int, data_str: str):
    """
    Calcula e retorna os horários disponíveis para um serviço, loja e data.
    """
    try:
        data_selecionada = datetime.strptime(data_str, '%Y-%m-%d').date()
    except ValueError:
        raise ValueError("Formato de data inválido. Use YYYY-MM-DD.")

    # 1. Verificar Bloqueios para o Dia (Tabela: dias_bloqueados)
    # Verifica se a loja específica (loja_id) ou TODAS as lojas (id_loja is null) estão bloqueadas
    bloqueio_res = supabase.table('dias_bloqueados') \
        .select('id_bloqueio, motivo') \
        .eq('data_bloqueada', data_str) \
        .or_(f'id_loja.eq.{loja_id},id_loja.is.null') \
        .execute()

    if bloqueio_res.data:
        print(f"[Controller] Dia {data_str} bloqueado.")
        return []

    # 2. Buscar Regra de Capacidade (Tabela: servicos_loja_regras)
    regra_res = supabase.table('servicos_loja_regras') \
        .select('capacidade_simultanea, ativo') \
        .eq('id_loja', loja_id) \
        .eq('id_servico', servico_id) \
        .maybe_single() \
        .execute()

    regra = regra_res.data
    if not regra or not regra.get('ativo'):
        print(f"[Controller] Serviço {servico_id} inativo ou sem regra na loja {loja_id}.")
        return []

    capacidade = regra['capacidade_simultanea']

    # 3. Buscar Duração do Serviço (Tabela: servicos)
    servico_res = supabase.table('servicos') \
        .select('duracao_media_minutos') \
        .eq('id_servico', servico_id) \
        .single() \
        .execute()
    
    duracao_servico = servico_res.data.get('duracao_media_minutos')
    if not duracao_servico or duracao_servico <= 0:
        print(f"[Controller] Duração do serviço inválida. Usando {INTERVALO_SLOT_MINUTOS} min.")
        duracao_servico = INTERVALO_SLOT_MINUTOS

    print(f"[Controller] Regra: Capacidade={capacidade}, Duração={duracao_servico} min")

    # 4. Buscar Agendamentos Existentes (Tabela: agendamentos)
    # Converte a data selecionada para o início e fim do dia em UTC
    # Isso garante que peguemos todos os agendamentos do dia, independente do fuso
    inicio_dia_utc = datetime.combine(data_selecionada, time.min, tzinfo=timezone.utc).isoformat()
    fim_dia_utc = datetime.combine(data_selecionada, time.max, tzinfo=timezone.utc).isoformat()

    agendamentos_res = supabase.table('agendamentos') \
        .select('data_hora_inicio, data_hora_fim') \
        .eq('id_loja', loja_id) \
        .gte('data_hora_inicio', inicio_dia_utc) \
        .lte('data_hora_inicio', fim_dia_utc) \
        .neq('status', 'cancelado') \
        .execute()

    agendamentos_existentes = agendamentos_res.data or []
    print(f"[Controller] {len(agendamentos_existentes)} agendamentos encontrados para o dia.")

    # 5. Calcular Slots Livres (Lógica de verificação de capacidade)
    horarios_disponiveis = []
    hora_atual = datetime.combine(data_selecionada, HORA_INICIO_PADRAO)
    hora_fim_dia = datetime.combine(data_selecionada, HORA_FIM_PADRAO)

    while hora_atual < hora_fim_dia:
        slot_inicio_local = hora_atual
        slot_fim_local = hora_atual + timedelta(minutes=duracao_servico)

        # Não permite agendar se o serviço terminar depois do horário de fechamento
        if slot_fim_local.time() > HORA_FIM_PADRAO:
            break

        agendamentos_conflitantes = 0
        for ag in agendamentos_existentes:
            try:
                # Converte os horários do BD (que estão em UTC) para objetos datetime
                inicio_ag_utc = datetime.fromisoformat(ag['data_hora_inicio'])
                fim_ag_utc = datetime.fromisoformat(ag['data_hora_fim'])

                # Converte os horários do slot (que estão locais) para UTC para comparar
                slot_inicio_utc = slot_inicio_local.astimezone(timezone.utc)
                slot_fim_utc = slot_fim_local.astimezone(timezone.utc)

                # Verifica sobreposição: (InicioA < FimB) e (FimA > InicioB)
                if slot_inicio_utc < fim_ag_utc and slot_fim_utc > inicio_ag_utc:
                    agendamentos_conflitantes += 1
            
            except Exception as e_conv:
                print(f"[Controller] Erro ao processar agendamento existente: {e_conv}")

        # Se o número de agendamentos conflitantes for MENOR que a capacidade, o slot está livre
        if agendamentos_conflitantes < capacidade:
            horarios_disponiveis.append(slot_inicio_local.strftime('%H:%M'))

        # Avança para o próximo slot da "grade"
        hora_atual += timedelta(minutes=INTERVALO_SLOT_MINUTOS)

    return horarios_disponiveis


def criar_novo_agendamento(supabase: Client, data: dict):
    """
    Valida e insere um novo agendamento na tabela 'agendamentos'.
    Re-verifica a disponibilidade para evitar conflitos.
    """
    try:
        # 1. Validação inicial e parsing dos dados vindos do front-end
        required_fields = ['id_cliente', 'id_pet', 'id_loja', 'id_servico', 'data_hora_inicio']
        if not all(field in data for field in required_fields):
            missing = [f for f in required_fields if f not in data]
            raise ValueError(f"Dados incompletos. Campos faltando: {', '.join(missing)}")

        id_cliente = data['id_cliente']
        id_pet = int(data['id_pet'])
        loja_id = int(data['id_loja'])
        servico_id = int(data['id_servico'])
        
        # O front-end manda a data e hora local (Ex: '2025-10-30T14:00')
        data_hora_inicio_local_str = data['data_hora_inicio']
        data_hora_inicio_local = datetime.fromisoformat(data_hora_inicio_local_str)

        # 2. Buscar duração e calcular fim
        servico_res = supabase.table('servicos').select('duracao_media_minutos').eq('id_servico', servico_id).single().execute()
        duracao = servico_res.data.get('duracao_media_minutos')
        if not duracao:
            duracao = INTERVALO_SLOT_MINUTOS # Fallback
            
        data_hora_fim_local = data_hora_inicio_local + timedelta(minutes=duracao)

        # 3. RE-VERIFICAÇÃO DE DISPONIBILIDADE (Mesma lógica do GET)
        regra_res = supabase.table('servicos_loja_regras').select('capacidade_simultanea').eq('id_loja', loja_id).eq('id_servico', servico_id).single().execute()
        capacidade = regra_res.data['capacidade_simultanea']

        # Converte o slot local para UTC para consultar o banco
        inicio_utc = data_hora_inicio_local.astimezone(timezone.utc)
        fim_utc = data_hora_fim_local.astimezone(timezone.utc)
        
        inicio_utc_str = inicio_utc.isoformat()
        fim_utc_str = fim_utc.isoformat()

        # Consulta quantos agendamentos JÁ EXISTEM que conflitam com este novo slot
        agendamentos_conflitantes_res = supabase.table('agendamentos') \
            .select('id_agendamento', count='exact') \
            .eq('id_loja', loja_id) \
            .lt('data_hora_inicio', fim_utc_str) \
            .gt('data_hora_fim', inicio_utc_str) \
            .neq('status', 'cancelado') \
            .execute()
        
        agendamentos_conflitantes = agendamentos_conflitantes_res.count or 0

        if agendamentos_conflitantes >= capacidade:
            raise ValueError(f"Desculpe, o horário {data_hora_inicio_local.strftime('%H:%M')} foi reservado por outra pessoa.")

        # 4. Inserir no banco (Usando a tabela 'agendamentos')
        insert_data = {
            'id_cliente': id_cliente,
            'id_pet': id_pet,
            'id_loja': loja_id,
            'id_servico': servico_id,
            'data_hora_inicio': inicio_utc_str, # Salva em UTC
            'data_hora_fim': fim_utc_str,       # Salva em UTC
            'status': 'confirmado', # Ou 'pendente' se você preferir
            'observacoes_cliente': data.get('observacoes_cliente')
        }

        # Executa o INSERT na tabela correta
        insert_res = supabase.table('agendamentos').insert(insert_data).execute()
        
        if insert_res.data:
            print(f"[Controller] Agendamento inserido com sucesso para cliente {id_cliente}.")
            return insert_res.data[0]
        else:
            raise Exception(f"Erro no Supabase ao salvar: {insert_res.error}")

    except ValueError as ve: # Erros de negócio (ex: slot ocupado)
        raise ve
    except Exception as e:   # Erros inesperados (ex: falha de banco)
        import traceback
        print(f"[Controller] ERRO FATAL ao criar agendamento: {e}")
        traceback.print_exc()
        raise Exception("Erro interno ao processar agendamento.")