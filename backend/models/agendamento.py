# backend/models/agendamento.py

from datetime import datetime
from typing import Optional, List
from uuid import UUID

class Agendamento:
    """
    Representa um registro de agendamento na tabela 'agendamentos'.
    Usa tipos nativos do Python para clareza e tipagem (typing).
    """
    def __init__(self,
                 id_agendamento: Optional[int],
                 id_cliente: UUID,
                 id_pet: Optional[int], # Permitindo Optional/NULL
                 id_loja: int,
                 id_servico: int,
                 data_hora_inicio: datetime,
                 data_hora_fim: datetime,
                 status: str = 'pendente',
                 observacoes_cliente: Optional[str] = None,
                 data_criacao: Optional[datetime] = None):
        
        self.id_agendamento = id_agendamento
        self.id_cliente = id_cliente
        self.id_pet = id_pet
        self.id_loja = id_loja
        self.id_servico = id_servico
        self.data_hora_inicio = data_hora_inicio
        self.data_hora_fim = data_hora_fim
        self.status = status
        self.observacoes_cliente = observacoes_cliente
        self.data_criacao = data_criacao

    @classmethod
    def from_supabase(cls, data: dict):
        """Cria um objeto Agendamento a partir de um dicionário retornado pelo Supabase."""
        return cls(
            id_agendamento=data.get('id_agendamento'),
            id_cliente=UUID(data['id_cliente']), # Converte string UUID para objeto UUID
            id_pet=data.get('id_pet'),
            id_loja=data['id_loja'],
            id_servico=data['id_servico'],
            data_hora_inicio=datetime.fromisoformat(data['data_hora_inicio'].replace('Z', '+00:00')),
            data_hora_fim=datetime.fromisoformat(data['data_hora_fim'].replace('Z', '+00:00')),
            status=data['status'],
            observacoes_cliente=data.get('observacoes_cliente'),
            data_criacao=datetime.fromisoformat(data['data_criacao'].replace('Z', '+00:00')) if data.get('data_criacao') else None
        )

    def to_dict(self) -> dict:
        """Converte o objeto para um dicionário, adequado para inserção no banco de dados."""
        return {
            'id_cliente': str(self.id_cliente),
            'id_pet': self.id_pet,
            'id_loja': self.id_loja,
            'id_servico': self.id_servico,
            'data_hora_inicio': self.data_hora_inicio.isoformat(),
            'data_hora_fim': self.data_hora_fim.isoformat(),
            'status': self.status,
            'observacoes_cliente': self.observacoes_cliente,
        }

    def __repr__(self):
        return f"<Agendamento ID={self.id_agendamento} | Cliente={self.id_cliente} | Data={self.data_hora_inicio.strftime('%Y-%m-%d %H:%M')}>"