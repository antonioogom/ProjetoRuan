import { supabase } from './supabaseClient.js';

function formatPrice(price) {
    if (typeof price !== 'number') return 'Consulte';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function createProductCard(produto) {
    const displayPrice = produto.preco_promocional && produto.preco_promocional < produto.preco 
        ? produto.preco_promocional 
        : produto.preco;
    return `
        <div class="card h-100 product-card shadow-sm">
            <img src="${produto.url_imagem}" class="card-img-top" alt="${produto.nome_produto}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title flex-grow-1">
                    <a href="produto.html?id=${produto.id_produto}" class="stretched-link text-decoration-none text-dark">
                        ${produto.nome_produto}
                    </a>
                </h5>
                <p class="card-text price fs-5 fw-bold text-primary">${formatPrice(displayPrice)}</p>
            </div>
        </div>
    `;
}

async function loadProducts(sectionId, query) {
    const container = document.getElementById(sectionId);
    if (!container || !supabase) { if(container) container.innerHTML = '<p class="text-danger">Erro de conexão.</p>'; return; }
    container.innerHTML = '<div class="spinner-border text-primary mx-auto" role="status"><span class="visually-hidden">Loading...</span></div>';
    const { data: produtos, error } = await query;
    if (error) { console.error(`Erro ao carregar seção ${sectionId}:`, error); container.innerHTML = '<p class="text-danger">Não foi possível carregar os produtos.</p>'; return; }
    if (produtos && produtos.length > 0) {
        container.innerHTML = produtos.map(createProductCard).join('');
    } else {
        container.innerHTML = '<p>Nenhum produto encontrado.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ofertasQuery = supabase.from('produtos').select('*').not('preco_promocional', 'is', null).order('data_cadastro', { ascending: false }).limit(8);
    loadProducts('ofertas-track', ofertasQuery);

    const recomendadosQuery = supabase.from('produtos').select('*').order('data_cadastro', { ascending: false }).limit(8);
    loadProducts('recomendados-track', recomendadosQuery);
});