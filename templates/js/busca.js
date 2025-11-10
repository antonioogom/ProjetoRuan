// js/busca.js (Versão Final e Corrigida)

// CAMINHO CORRIGIDO (./ significa "na mesma pasta")
import { supabase } from './supabaseClient.js';

// --- ELEMENTOS DO DOM (Apenas os que existem nesta página) ---
const resultsContainer = document.getElementById('search-results-container');
const searchTermDisplay = document.getElementById('search-term-display');
const resultsCount = document.getElementById('results-count');
const searchInputBar = document.getElementById('search-input-bar');
const categoryFiltersContainer = document.getElementById('category-filters');
const brandFiltersContainer = document.getElementById('brand-filters');
const tamanhoFiltersContainer = document.getElementById('tamanho-filters');
const filtersContainer = document.getElementById('filters-container');

// ==========================================================================
// FUNÇÕES DE FAVORITOS (Copiadas para este arquivo)
// ==========================================================================

function getFavorites() { return JSON.parse(localStorage.getItem('chateau_favorites')) || []; }
function saveFavorites(favorites) { localStorage.setItem('chateau_favorites', JSON.stringify(favorites)); }

function toggleFavorite(productId) { 
    let favorites = getFavorites();
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) return;
    if (favorites.includes(productIdNum)) {
        favorites = favorites.filter(id => id !== productIdNum);
    } else {
        favorites.push(productIdNum);
    }
    saveFavorites(favorites);
    updateFavoriteButtons();
}

function updateFavoriteButtons() { 
    const favorites = getFavorites();
    document.querySelectorAll('.btn-favorite').forEach(button => {
        const productId = parseInt(button.dataset.productId, 10);
        if (!isNaN(productId)) {
            button.classList.toggle('active', favorites.includes(productId));
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-heart', !favorites.includes(productId));
                icon.classList.toggle('bi-heart-fill', favorites.includes(productId));
            }
        }
    });
}

// ==========================================================================
// FUNÇÕES DE CARD E PREÇO (Copiadas para este arquivo)
// ==========================================================================

function formatPrice(price) { 
    if (typeof price !== 'number') return 'Consulte';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

function createProductCard(produto) { 
    if (!produto || typeof produto.id_produto === 'undefined') { return ''; }
    
    const originalPrice = produto.preco;
    const promoPrice = produto.preco_promocional;
    const isPromo = promoPrice && promoPrice < originalPrice;
    const displayPrice = isPromo ? promoPrice : originalPrice;
    
    const favorites = getFavorites();
    const isFavorite = favorites.includes(parseInt(produto.id_produto, 10));
    const heartIconClass = isFavorite ? 'bi-heart-fill' : 'bi-heart';
    
    // Caminho relativo ao root (onde busca.html está)
    const productLink = `produto.html?id=${produto.id_produto}`;
    
    let imageUrl = produto.url_imagem;
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `img/${produto.url_imagem || 'placeholder.png'}`; 
    }
    if (!imageUrl || imageUrl.trim() === "") { imageUrl = 'img/placeholder.png'; }
    
    return `
        <div class="card h-100 product-card shadow-sm position-relative">
            <button class="btn btn-outline-danger btn-favorite position-absolute top-0 end-0 m-2 ${isFavorite ? 'active' : ''}" data-product-id="${produto.id_produto}" style="z-index: 10;">
                <i class="bi ${heartIconClass}"></i>
            </button>
            <a href="${productLink}" class="d-block text-center pt-3">
                <img src="${imageUrl}" class="card-img-top" alt="${produto.nome_produto || 'Produto sem nome'}">
            </a>
            <div class="card-body d-flex flex-column text-center">
                <h5 class="card-title flex-grow-1 card-title-limit fs-6 mb-2">
                    <a href="${productLink}" class="text-decoration-none text-dark">
                        ${produto.nome_produto || '(Sem Nome)'}
                    </a>
                </h5>
                <div class="price-container mt-auto mb-2">
                    ${isPromo ? `<p class="text-muted text-decoration-line-through small mb-0">${formatPrice(originalPrice)}</p>` : ''}
                    <p class="card-text price fs-5 fw-bold main-purple-text mb-0">${formatPrice(displayPrice)}</p>
                </div>
                
                <a href="${productLink}" class="btn btn-sm btn-custom mt-2" style="z-index: 5;">
                   <i class="bi bi-search me-1"></i> Consultar Produto
                </a>
            </div>
        </div>
    `;
}

// ==========================================================================
// LÓGICA DE BUSCA E FILTROS (Específica desta página)
// ==========================================================================

async function populateFilters() {
    try {
        const { data: produtos, error } = await supabase
            .from('produtos')
            .select('tipo_produto, marca, tamanho_medida');

        if (error) {
            console.error("Erro ao buscar filtros (Verifique RLS):", error);
            throw error;
        }

        const categorias = [...new Set(produtos.map(p => p.tipo_produto).filter(Boolean))].sort();
        const marcas = [...new Set(produtos.map(p => p.marca).filter(Boolean))].sort();
        const tamanhos = [...new Set(produtos.map(p => p.tamanho_medida).filter(Boolean))].sort();
        
        if(categoryFiltersContainer) categoryFiltersContainer.innerHTML = categorias.map(c => `
            <div class="form-check"><input class="form-check-input filter-checkbox" type="checkbox" value="${c}" id="cat-${c}" data-column="tipo_produto">
            <label class="form-check-label" for="cat-${c}">${c}</label></div>
        `).join('');

        if(brandFiltersContainer) brandFiltersContainer.innerHTML = marcas.map(m => `
            <div class="form-check"><input class="form-check-input filter-checkbox" type="checkbox" value="${m}" id="brand-${m}" data-column="marca">
            <label class="form-check-label" for="brand-${m}">${m}</label></div>
        `).join('');

        if(tamanhoFiltersContainer) tamanhoFiltersContainer.innerHTML = tamanhos.map(t => `
            <div class="form-check"><input class="form-check-input filter-checkbox" type="checkbox" value="${t}" id="size-${t}" data-column="tamanho_medida">
            <label class="form-check-label" for="size-${t}">${t}</label></div>
        `).join('');

    } catch (error) {
        console.error("Erro ao popular filtros:", error.message);
        if(categoryFiltersContainer) categoryFiltersContainer.innerHTML = "<p class='text-danger small'>Erro ao carregar filtros.</p>";
    }
}

async function performSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q') || '';

    if (!resultsContainer || !supabase) return;

    if(searchTermDisplay) searchTermDisplay.textContent = searchTerm;
    if(searchInputBar) searchInputBar.value = searchTerm;
    resultsContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
    if(resultsCount) resultsCount.textContent = 'Buscando...';

    const currentActiveFilters = {
        'tipo_produto': [],
        'marca': [],
        'tamanho_medida': [],
        'preco_min': parseFloat(document.getElementById('price-min')?.value) || null,
        'preco_max': parseFloat(document.getElementById('price-max')?.value) || null
    };

    document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
        const column = checkbox.dataset.column;
        if (currentActiveFilters.hasOwnProperty(column)) {
            currentActiveFilters[column].push(checkbox.value);
        }
    });
    
    let query = supabase.from('produtos').select('*');
    
    // =================================================================
    // CORREÇÃO DA BUSCA (IGNORAR ACENTOS)
    // =================================================================
    if (searchTerm) {
        // 1. Prepara o termo de busca: 'racao barata' vira "racao:*" E "barata:*"
        // Isso ignora acentos E faz busca por prefixo (ex: "rac" acha "ração")
        const formattedSearchTerm = searchTerm.trim().split(/\s+/)
            .filter(Boolean)
            .map(t => `${t}:*`)
            .join(' & ');

        // 2. Substitui o .ilike() por .or() com .textSearch() (ou .fts())
        // O 'portuguese' é o que faz a mágica de ignorar acentos.
        query = query.or(
            `nome_produto.fts(portuguese).${formattedSearchTerm},` +
            `descricao.fts(portuguese).${formattedSearchTerm},` +
            `marca.fts(portuguese).${formattedSearchTerm},` +
            `tipo_produto.fts(portuguese).${formattedSearchTerm}`
        );
    }
    // =================================================================
    
    if (currentActiveFilters.tipo_produto.length > 0) {
        query = query.in('tipo_produto', currentActiveFilters.tipo_produto);
    }
    if (currentActiveFilters.marca.length > 0) {
        query = query.in('marca', currentActiveFilters.marca);
    }
    if (currentActiveFilters.tamanho_medida.length > 0) {
        query = query.in('tamanho_medida', currentActiveFilters.tamanho_medida); 
    }
    if (currentActiveFilters.preco_min !== null) {
        query = query.gte('preco', currentActiveFilters.preco_min);
    }
    if (currentActiveFilters.preco_max !== null) {
        query = query.lte('preco', currentActiveFilters.preco_max);
    }
    
    query = query.order('nome_produto', { ascending: true });

    try {
        const { data: produtos, error } = await query;
        if (error) {
             console.error("Erro na busca Supabase (Verifique RLS):", error);
             throw new Error(error.message);
        }

        if (produtos && produtos.length > 0) {
            resultsContainer.innerHTML = produtos.map(produto => `<div class="col">${createProductCard(produto)}</div>`).join('');
            if(resultsCount) resultsCount.textContent = `${produtos.length} resultados encontrados.`;
            updateFavoriteButtons();
        } else {
            resultsContainer.innerHTML = '<div class="col-12 text-center py-5"><h3>Nenhum resultado encontrado para esta busca.</h3></div>';
            if(resultsCount) resultsCount.textContent = '0 resultados encontrados.';
        }
    } catch (error) {
        console.error("Erro ao realizar pesquisa:", error);
        resultsContainer.innerHTML = `<div class="col-12 text-center py-5"><h3 class="text-danger">Erro ao carregar resultados: ${error.message}</h3></div>`;
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    populateFilters().then(() => {
        performSearch();
    });
    
    filtersContainer?.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-checkbox')) {
            performSearch();
        }
    });

    document.getElementById('apply-price-filter')?.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });

    document.body.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('.btn-favorite');
        if (favoriteButton) {
            const productId = favoriteButton.dataset.productId;
            if (productId) { toggleFavorite(productId); }
        }
    });
});