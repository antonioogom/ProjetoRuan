# backend/models/pet.py

from typing import Optional
from uuid import UUID

class Pet:
    """
    Representa um animal de estimação na tabela 'pets'.
    Reflete as colunas que criamos: id_pet, id_tutor, nome_pet, raca, porte, etc.
    """
    def __init__(self,
                 id_pet: Optional[int],
                 id_tutor: UUID,
                 nome_pet: str,
                 especie: str,
                 raca: str,
                 porte: Optional[str] = None,
                 data_nascimento: Optional[str] = None, # Usando string para datas simples
                 observacoes: Optional[str] = None):
        
        self.id_pet = id_pet
        self.id_tutor = id_tutor
        self.nome_pet = nome_pet
        self.especie = especie
        self.raca = raca
        self.porte = porte
        self.data_nascimento = data_nascimento
        self.observacoes = observacoes

    @classmethod
    def from_supabase(cls, data: dict):
        """Cria um objeto Pet a partir de um dicionário retornado pelo Supabase."""
        return cls(
            id_pet=data.get('id_pet'),
            id_tutor=UUID(data['id_tutor']),
            nome_pet=data['nome_pet'],
            especie=data['especie'],
            raca=data['raca'],
            porte=data.get('porte'),
            data_nascimento=data.get('data_nascimento'),
            observacoes=data.get('observacoes')
        )

    def to_dict(self) -> dict:
        """Converte o objeto para um dicionário para inserção/atualização no banco de dados."""
        return {
            'id_tutor': str(self.id_tutor),
            'nome_pet': self.nome_pet,
            'especie': self.especie,
            'raca': self.raca,
            'porte': self.porte,
            'data_nascimento': self.data_nascimento,
            'observacoes': self.observacoes,
        }

    def __repr__(self):
        return f"<Pet ID={self.id_pet} | Nome={self.nome_pet} | Raça={self.raca}>"