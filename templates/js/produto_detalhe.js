// js/produto_detalhe.js
// Este script busca os detalhes de UM produto específico e exibe na página.

import { supabase } from './supabaseClient.js';

// Função para formatar o preço
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) { return 'R$ 0,00'; }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função principal para carregar os detalhes
async function loadProductDetails() {
    
    // --- 1. Pegar o ID da URL ---
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id'); // Pega o valor depois de "?id="

    // Seleciona os elementos da página
    const loading = document.getElementById('loading-product');
    const notFound = document.getElementById('product-not-found');
    const productDataEl = document.getElementById('product-data');

    if (!productId) {
        // Se não tiver ID na URL, mostra erro
        loading.style.display = 'none';
        notFound.style.display = 'block';
        return;
    }

    try {
        // --- 2. Buscar o produto no Supabase usando o ID ---
        let { data: produto, error } = await supabase
            .from('produtos')
            .select('*') // Pega todas as colunas
            .eq('id_produto', productId) // Onde o id_produto é igual ao da URL
            .single(); // Esperamos apenas UM resultado

        if (error || !produto) {
            throw new Error('Produto não encontrado.');
        }

        // --- 3. Preencher a página com os dados ---
        
        // Esconde o "Carregando"
        loading.style.display = 'none';

        // Imagem (com fallback)
        const imageUrl = produto.url_imagem || 'img/produto_sem_imagem.png';
        document.getElementById('product-image').src = imageUrl;
        document.getElementById('product-image').alt = produto.nome_produto;
        
        // Textos
        document.getElementById('product-name').textContent = produto.nome_produto;
        document.getElementById('product-price').textContent = formatPrice(produto.preco);
        
        // Descrição (usamos 'textContent' para segurança e 'white-space: pre-wrap' no CSS para quebras de linha)
        document.getElementById('product-description').textContent = produto.descricao || 'Este produto não possui descrição detalhada.';
        
        // Marca (opcional)
        document.getElementById('product-brand').textContent = produto.marca || 'Não informada';
        
        // Muda o título da aba do navegador
        document.title = `${produto.nome_produto} - Chateau du Pet`;

        // Mostra o conteúdo do produto
        productDataEl.style.display = 'flex'; // 'flex' por causa do 'row' do Bootstrap

    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error.message);
        // Mostra a mensagem de "Não Encontrado"
        loading.style.display = 'none';
        notFound.style.display = 'block';
    }
}

// Inicia o carregamento quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadProductDetails);