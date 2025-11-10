// js/carrinho.js

// Importa a conexão Supabase e o cliente (para buscar detalhes dos produtos)
import { supabase } from './supabaseClient.js';

// Função auxiliar para buscar a lista de IDs de favoritos (Lista de Desejos/Carrinho)
function getCartItems() {
    // Reutilizando o localStorage de favoritos como nosso "carrinho" temporário
    return JSON.parse(localStorage.getItem('chateau_favorites')) || [];
}

function saveCartItems(itemIds) {
    localStorage.setItem('chateau_favorites', JSON.stringify(itemIds));
}

// Função para formatar o preço em BRL
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Remove um item do carrinho (persiste no localStorage)
function removeItemFromCart(productId) {
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) return;

    let cartItems = getCartItems();
    
    // Filtra e salva
    cartItems = cartItems.filter(id => id !== productIdNum);
    saveCartItems(cartItems);

    // Atualiza a interface
    renderCart(); 

    alert('Produto removido do carrinho (lista de desejos)!');
}

// Cria o HTML de um único item do carrinho
function createCartItemHtml(product) {
    // Usando dados mock para quantidade, já que o localStorage só guarda o ID
    const quantity = 1; 
    const itemTotal = product.preco * quantity;

    return `
        <div class="cart-item" id="cart-item-${product.id_produto}">
            <img src="../img/${product.url_imagem}" alt="${product.nome_produto}">
            <div class="item-details">
                <h6>${product.nome_produto}</h6>
                <small class="text-muted">ID: ${product.id_produto} | Preço Unitário: ${formatPrice(product.preco)}</small>
            </div>
            <div class="item-quantity input-group mx-4" style="width: 120px;">
                <button class="btn btn-outline-secondary btn-sm" disabled>-</button>
                <input type="text" class="form-control form-control-sm" value="${quantity}" readonly style="text-align: center;">
                <button class="btn btn-outline-secondary btn-sm" disabled>+</button>
            </div>
            <div class="text-end" style="width: 100px;">
                <span class="fw-bold">${formatPrice(itemTotal)}</span>
                <button class="btn btn-link text-danger p-0 mt-1 btn-remove" data-product-id="${product.id_produto}" title="Remover Item">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
        </div>
    `;
}

// Função principal para renderizar o carrinho/lista
async function renderCart() {
    const listContainer = document.getElementById('cart-list-container');
    const summaryContainer = document.getElementById('summary-card-body');
    const totalCountElement = document.getElementById('total-item-count');
    const favoriteIds = getCartItems();

    if (!listContainer || !summaryContainer) return;

    listContainer.innerHTML = '';
    summaryContainer.innerHTML = '';
    totalCountElement.textContent = favoriteIds.length;

    if (favoriteIds.length === 0) {
        listContainer.innerHTML = '<div class="alert alert-info text-center mt-4">Seu carrinho está vazio. Adicione produtos na <a href="../home.html">página inicial</a>!</div>';
        summaryContainer.innerHTML = '<h4>Total: R$ 0,00</h4><p class="text-muted">Nenhum item selecionado.</p>';
        return;
    }

    // 1. Consulta o Supabase para obter os detalhes dos produtos
    listContainer.innerHTML = '<div class="text-center my-5"><span class="spinner-border text-primary"></span> Carregando produtos...</div>';
    
    try {
        const { data: products, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, url_imagem, preco')
            .in('id_produto', favoriteIds);

        if (error || !products) throw new Error(error?.message || 'Erro ao buscar detalhes dos produtos.');

        let subtotal = 0;

        // 2. Renderiza a lista de produtos
        listContainer.innerHTML = products.map(product => {
            // Ajusta o caminho da imagem se necessário
            product.url_imagem = product.url_imagem.split('/').pop() || 'placeholder.png'; // Pega só o nome do arquivo para usar ../img/
            
            // Calculo simples (quantidade mock = 1)
            subtotal += product.preco; 
            return createCartItemHtml(product);
        }).join('');

        // 3. Atualiza o resumo
        const frete = 15.00; // Valor fixo de frete para simulação
        const totalPagar = subtotal + frete;

        summaryContainer.innerHTML = `
            <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between bg-transparent px-0"><span>Subtotal (${favoriteIds.length} itens)</span> <span>${formatPrice(subtotal)}</span></li>
                <li class="list-group-item d-flex justify-content-between bg-transparent px-0"><span>Frete Estimado</span> <span>${formatPrice(frete)}</span></li>
                <li class="list-group-item d-flex justify-content-between bg-transparent px-0 fw-bold"><strong>Total a Pagar:</strong><strong>${formatPrice(totalPagar)}</strong></li>
            </ul>
        `;

    } catch (error) {
        console.error('Erro na renderização do carrinho:', error.message);
        listContainer.innerHTML = `<div class="alert alert-danger">Não foi possível carregar os itens: ${error.message}</div>`;
    }
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicia a renderização
    renderCart();

    // Listener para o botão de remoção
    document.getElementById('cart-list-container')?.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.btn-remove');
        if (removeButton) {
            const productId = removeButton.dataset.productId;
            if (confirm('Tem certeza que deseja remover este item da lista de desejos/carrinho?')) {
                removeItemFromCart(productId);
            }
        }
    });

    // Listener para o botão "Limpar Carrinho"
    document.getElementById('clear-cart-button')?.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover TODOS os itens do carrinho?')) {
            saveCartItems([]); // Salva uma lista vazia no localStorage
            renderCart(); // Re-renderiza a página
        }
    });
});