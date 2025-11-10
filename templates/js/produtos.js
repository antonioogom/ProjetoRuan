// js/produtos.js
// Este script busca os produtos no Supabase e exibe na página 'produtos.html'

import { supabase } from './supabaseClient.js';

// Função para formatar o preço
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) { return 'R$ 0,00'; }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função principal para carregar os produtos
async function loadPublicProducts() {
    const container = document.getElementById('product-list-container');
    const loading = document.getElementById('loading-products');
    const noProducts = document.getElementById('no-products');

    if (!container || !loading || !noProducts) {
        console.error("Elementos da página não encontrados.");
        return;
    }

    try {
        // 1. Busca os produtos na tabela 'produtos'
        // (Igual o admin faz, mas agora para mostrar ao público)
        let { data: produtos, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, preco, url_imagem, descricao')
            .order('nome_produto', { ascending: true });

        if (error) { throw error; }

        // Esconde o "Carregando"
        loading.style.display = 'none';

        // 2. Verifica se encontrou produtos
        if (produtos && produtos.length > 0) {
            
            // Limpa o container (caso tenha algo)
            container.innerHTML = ''; 

            // 3. Cria um card para cada produto
            produtos.forEach(produto => {
                // Imagem Padrão (caso 'url_imagem' esteja vazia)
                const imageUrl = produto.url_imagem || 'img/produto_sem_imagem.png'; 
                
                // Limita a descrição (opcional)
                const shortDescription = produto.descricao 
                    ? produto.descricao.substring(0, 100) + (produto.descricao.length > 100 ? '...' : '') 
                    : 'Veja mais detalhes';

                // ESTE É O LINK MÁGICO (a "interação")
                // Ele leva para a página de 'detalhe' e passa o ID do produto na URL
                const detailUrl = `produto_detalhe.html?id=${produto.id_produto}`;

                const cardHtml = `
                    <div class="col-md-4 col-lg-3">
                        <a href="${detailUrl}" class="card h-100 product-card">
                            <img src="${imageUrl}" class="card-img-top" alt="${produto.nome_produto}">
                            <div class="card-body">
                                <h5 class="card-title">${produto.nome_produto}</h5>
                                <p class="card-text text-muted small">${shortDescription}</p>
                            </div>
                            <div class="card-footer bg-white border-top-0 pb-3">
                                <h4 class="card-title text-primary">${formatPrice(produto.preco)}</h4>
                                <span class="btn btn-primary w-100">Ver detalhes</span>
                            </div>
                        </a>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHtml);
            });

        } else {
            // Se não tiver produtos, mostra a mensagem
            noProducts.style.display = 'block';
        }

    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message);
        loading.style.display = 'none';
        container.innerHTML = `<p class="text-danger">Erro ao carregar produtos. Tente novamente.</p>`;
    }
}

// Inicia o carregamento quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadPublicProducts);