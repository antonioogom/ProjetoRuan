# backend/controllers/produto_controller.py

from supabase import Client

def listar_produtos(supabase: Client):
    """Lista todos os produtos para o Painel ADM."""
    try:
        res = supabase.table('produtos').select('*').order('nome_produto').execute()
        return res.data
    except Exception as e:
        print(f"[ProdutoController] Erro ao listar produtos: {e}")
        raise

def buscar_produto_por_id(supabase: Client, produto_id: int):
    """Busca um produto pelo ID (para edição e consulta)."""
    try:
        res = supabase.table('produtos').select('*').eq('id_produto', produto_id).maybe_single().execute()
        return res.data
    except Exception as e:
        print(f"[ProdutoController] Erro ao buscar produto ID {produto_id}: {e}")
        raise

def inserir_produto(supabase: Client, dados: dict):
    """Insere um novo produto."""
    try:
        res = supabase.table('produtos').insert(dados).execute()
        return res.data
    except Exception as e:
        print(f"[ProdutoController] Erro ao inserir produto: {e}")
        raise

def atualizar_produto(supabase: Client, produto_id: int, dados: dict):
    """Atualiza um produto existente."""
    try:
        dados.pop('id_produto', None)
        res = supabase.table('produtos').update(dados).eq('id_produto', produto_id).execute()
        return res.data
    except Exception as e:
        print(f"[ProdutoController] Erro ao atualizar produto ID {produto_id}: {e}")
        raise

def deletar_produto(supabase: Client, produto_id: int):
    """Deleta um produto pelo ID."""
    try:
        supabase.table('produtos').delete().eq('id_produto', produto_id).execute()
        return True
    except Exception as e:
        print(f"[ProdutoController] Erro ao deletar produto ID {produto_id}: {e}")
        raise