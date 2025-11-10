# backend/db/supabase_client.py

from supabase import Client
from typing import Optional, List
from uuid import UUID
import traceback

# Importa os Models que criamos
from ..models.pet import Pet 
from ..models.agendamento import Agendamento 

def get_pet_by_id(supabase: Client, pet_id: int):
    """Busca um Pet na tabela 'pets' pelo ID."""
    try:
        res = supabase.table('pets').select('*').eq('id_pet', pet_id).maybe_single().execute()
        if res.data:
            return Pet.from_supabase(res.data)
        return None
    except Exception as e:
        print(f"[DB-Pet] Erro ao buscar pet ID {pet_id}: {e}")
        traceback.print_exc()
        return None

def listar_pets_por_tutor(supabase: Client, tutor_id: UUID) -> List[Pet]:
    """Lista todos os pets de um tutor específico."""
    try:
        res = supabase.table('pets').select('*').eq('id_tutor', str(tutor_id)).order('nome_pet').execute()
        if res.data:
            return [Pet.from_supabase(data) for data in res.data]
        return []
    except Exception as e:
        print(f"[DB-Pet] Erro ao listar pets do tutor {tutor_id}: {e}")
        traceback.print_exc()
        return []

def salvar_novo_pet(supabase: Client, pet_data: Pet):
    """Insere um novo pet na tabela 'pets'."""
    try:
        dados_dict = pet_data.to_dict()
        res = supabase.table('pets').insert(dados_dict).select('*').single().execute()
        
        if hasattr(res, 'error') and res.error:
            raise Exception(f"Erro Supabase: {res.error.message}")
        
        if res.data:
            return Pet.from_supabase(res.data)
        return None
    except Exception as e:
        print(f"[DB-Pet] Erro ao salvar novo pet: {e}")
        traceback.print_exc()
        raise