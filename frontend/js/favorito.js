import { supabase } from '/js/supabaseClient.js';

const favoritesListContainer = document.getElementById('favorites-list');
const noFavoritesMessage = document.getElementById('no-favorites-message');

function getFavorites() { return JSON.parse(localStorage.getItem('chateau_favorites')) || []; }
function saveFavorites(favorites) { localStorage.setItem('chateau_favorites', JSON.stringify(favorites)); }

function formatPrice(price) {
    if (typeof price !== 'number') return 'Consulte';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function createFavoriteCard(product) {
    return `
        <div class="card-favorite">
            <a href="/produto.html?id=${product.id_produto}">
                <img src="${product.url_imagem}" alt="${product.nome_produto}">
            </a>
            <div class="card-favorite-body">
                <h5 class="card-title">${product.nome_produto}</h5>
                <p class="price fw-bold main-purple-text">${formatPrice(product.preco)}</p>
                <button class="btn btn-custom btn-sm" onclick="alert('Funcionalidade de carrinho a ser implementada aqui.');">Adicionar ao Carrinho</button>
                <button class="btn btn-outline-danger btn-sm mt-2 btn-remove-fav" data-product-id="${product.id_produto}">
                    <i class="bi bi-heartbreak-fill me-1"></i> Remover
                </button>
            </div>
        </div>
    `;
}

async function renderFavoritesPage() {
    if (!favoritesListContainer) return;
    const favoriteIds = getFavorites();
    
    favoritesListContainer.innerHTML = '<div class="spinner-border main-purple-text" role="status"></div>';
    
    if (favoriteIds.length === 0) {
        favoritesListContainer.style.display = 'none';
        noFavoritesMessage.style.display = 'block';
        return;
    }
    
    favoritesListContainer.style.display = 'grid';
    noFavoritesMessage.style.display = 'none';

    const { data: products, error } = await supabase.from('produtos').select('*').in('id_produto', favoriteIds);

    if (error || !products) {
        favoritesListContainer.innerHTML = '<p class="text-danger">Erro ao carregar favoritos.</p>';
        return;
    }

    if (products.length === 0) {
        favoritesListContainer.style.display = 'none';
        noFavoritesMessage.style.display = 'block';
        return;
    }

    favoritesListContainer.innerHTML = products.map(createFavoriteCard).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderFavoritesPage();
    favoritesListContainer.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.btn-remove-fav');
        if (removeButton) {
            const productId = removeButton.dataset.productId;
            if (confirm('Tem certeza que deseja remover este item dos favoritos?')) {
                let favorites = getFavorites().filter(id => id !== parseInt(productId));
                saveFavorites(favorites);
                renderFavoritesPage(); // Re-desenha a tela de favoritos
            }
        }
    });
});