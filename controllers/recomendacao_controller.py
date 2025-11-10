# backend/controllers/recomendacao_controller.py

from supabase import Client

def buscar_ofertas(supabase: Client):
    """Busca produtos com preço promocional para a Home."""
    try:
        res = supabase.table('produtos') \
            .select('id_produto, nome_produto, url_imagem, preco, preco_promocional, data_cadastro') \
            .not_eq('preco_promocional', None) \
            .order('data_cadastro', desc=True) \
            .limit(8) \
            .execute()
        return res.data
    except Exception as e:
        print(f"[RecomendacaoController] Erro ao buscar ofertas: {e}")
        raise

def buscar_novidades(supabase: Client, limite: int = 8):
    """Busca produtos mais recentes para a seção Novidades e Recomendados."""
    try:
        res = supabase.table('produtos') \
            .select('id_produto, nome_produto, url_imagem, preco, preco_promocional, data_cadastro') \
            .order('data_cadastro', desc=True) \
            .limit(limite) \
            .execute()
        return res.data
    except Exception as e:
        print(f"[RecomendacaoController] Erro ao buscar novidades: {e}")
        raise
        
def buscar_mais_vendidos(supabase: Client, limite: int = 12):
    """Busca produtos com maior estoque (simulação de mais vendidos) para o Grid."""
    try:
        res = supabase.table('produtos') \
            .select('id_produto, nome_produto, url_imagem, preco, preco_promocional, quantidade_estoque') \
            .order('quantidade_estoque', desc=True) \
            .limit(limite) \
            .execute()
        return res.data
    except Exception as e:
        print(f"[RecomendacaoController] Erro ao buscar mais vendidos: {e}")
        raise