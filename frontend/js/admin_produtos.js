// js/admin_produtos.js
// VERSÃO FINAL: Segurança Desativada + Imports Corretos + Realtime

import { supabase } from './supabaseClient.js';
// DESATIVADO: import { checkAdminAuth } from './admin_auth.js'; 

// --- VARIÁVEIS GLOBAIS ---
let productModalInstance; 
const productModalElement = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalLabel = document.getElementById('productModalLabel');
const editProductIdInput = document.getElementById('editProductId'); 
const saveProductButton = document.getElementById('saveProductButton');
const addProductButton = document.getElementById('add-product-button'); 

// --- FUNÇÕES AUXILIARES ---
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) { return 'Inválido'; }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function clearProductForm() {
    productForm.reset(); 
    editProductIdInput.value = ''; 
    productModalLabel.textContent = 'Adicionar Novo Produto'; 
    saveProductButton.textContent = 'Salvar Produto';
    saveProductButton.disabled = false;
}
function populateProductForm(produto) {
    if (!produto) return;
    document.getElementById('nome_produto').value = produto.nome_produto || '';
    document.getElementById('preco').value = produto.preco !== null ? produto.preco : '';
    document.getElementById('quantidade_estoque').value = produto.quantidade_estoque !== null ? produto.quantidade_estoque : '';
    document.getElementById('url_imagem').value = produto.url_imagem || '';
    document.getElementById('descricao').value = produto.descricao || '';
    document.getElementById('marca').value = produto.marca || '';
    document.getElementById('tipo_produto').value = produto.tipo_produto || '';
    editProductIdInput.value = produto.id_produto; 
    productModalLabel.textContent = `Editar Produto (ID: ${produto.id_produto})`; 
}
// --- NOVO: Função para criar o HTML da linha ---
function createProductRowHtml(produto) {
    return `
        <tr id="product-row-${produto.id_produto}">
            <td>${produto.id_produto}</td>
            <td>${produto.nome_produto || '(Sem nome)'}</td>
            <td>${formatPrice(produto.preco)}</td>
            <td>${produto.quantidade_estoque !== null && !isNaN(produto.quantidade_estoque) ? produto.quantidade_estoque : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-action btn-edit" title="Editar" data-id="${produto.id_produto}" data-bs-toggle="modal" data-bs-target="#productModal"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-danger btn-action btn-delete" title="Excluir" data-id="${produto.id_produto}"><i class="bi bi-trash-fill"></i></button>
            </td>
        </tr>`;
}

// --- FUNÇÕES CRUD ---
async function loadAndDisplayProducts() {
    const tableBody = document.getElementById('product-table-body');
    const loadingRow = document.getElementById('loading-row');
    const noProductsRow = document.getElementById('no-products-row');
    if (!tableBody || !loadingRow || !noProductsRow) { return; }
    loadingRow.style.display = 'table-row';
    noProductsRow.style.display = 'none';
    const existingRows = tableBody.querySelectorAll("tr:not(#loading-row):not(#no-products-row)");
    existingRows.forEach(row => row.remove());
    try {
        let { data: produtos, error } = await supabase
            .from('produtos')
            .select('*') // Pega tudo
            .order('nome_produto', { ascending: true });
        if (error) { throw error; }
        loadingRow.style.display = 'none';
        if (produtos && produtos.length > 0) {
            produtos.forEach(produto => {
                const rowHtml = createProductRowHtml(produto); // Usa a nova função
                tableBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        } else {
            noProductsRow.style.display = 'table-row';
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message);
        loadingRow.style.display = 'none';
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar: ${error.message}.</td></tr>`;
    }
}
async function fetchProductDetails(productId) {
    try {
 		let { data: produto, error } = await supabase
 			.from('produtos')
 			.select('*')
 			.eq('id_produto', productId)
 			.single(); 
 		if (error) { throw error; }
 		return produto; 
 	} catch (error) {
 		alert(`Não foi possível carregar os dados do produto. ${error.message}`);
 		return null; 
 	}
}
async function addProduct(productData) {
    try {
 		let { data: maxIdData, error: maxIdError } = await supabase
 			.from('produtos')
 			.select('id_produto')
 			.order('id_produto', { descending: true })
 			.limit(1)
 			.single();
 		if (maxIdError && maxIdError.code !== 'PGRST116') { throw new Error('Erro ao buscar último ID: ' + maxIdError.message); }
 		const nextId = maxIdData ? maxIdData.id_produto + 1 : 1;
 		productData.id_produto = nextId; 
 		const { data, error } = await supabase.from('produtos').insert([productData]).select(); 
 		if (error) { throw error; }
 		alert('Produto adicionado com sucesso!');
 		return true; 
 	} catch (error) {
 		alert(`Erro ao adicionar produto: ${error.message}`);
 		return false; 
 	}
}
async function updateProduct(productId, productData) {
    try {
 		const { data, error } = await supabase.from('produtos').update(productData).eq('id_produto', productId).select(); 
 		if (error) { throw error; }
 		alert('Produto atualizado com sucesso!');
 		return true; 
 	} catch (error) {
 		alert(`Erro ao atualizar produto: ${error.message}`);
 		return false; 
 	}
}
async function deleteProduct(productId) {
    try {
 		const { error } = await supabase.from('produtos').delete().eq('id_produto', productId); 
 		if (error) { throw error; }
 		alert('Produto excluído com sucesso!');
 		return true; 
 	} catch (error) {
 		alert(`Erro ao excluir produto: ${error.message}`);
 		return false; 
 	}
}

// --- NOVO: Função para "escutar" o banco de dados ---
function listenForProductChanges() {
    console.log("Ouvindo por mudanças nos produtos...");
    const channel = supabase
        .channel('public:produtos')
        .on('postgres_changes', 
            { 
                event: '*', // Escuta TUDO: INSERT, UPDATE, DELETE
                schema: 'public', 
                table: 'produtos' 
            }, 
            (payload) => {
                console.log('Mudança nos produtos recebida!', payload);
                const tableBody = document.getElementById('product-table-body');
                const noProductsRow = document.getElementById('no-products-row');
                if (payload.eventType === 'INSERT') {
                    if (noProductsRow) noProductsRow.style.display = 'none';
                    const newRowHtml = createProductRowHtml(payload.new);
                    tableBody.insertAdjacentHTML('beforeend', newRowHtml); // Adiciona no fim
                    const newRow = tableBody.querySelector(`#product-row-${payload.new.id_produto}`);
                    if (newRow) newRow.classList.add('new-appointment-highlight'); // Reusa a animação
                } 
                else if (payload.eventType === 'UPDATE') {
                    const updatedRow = tableBody.querySelector(`#product-row-${payload.new.id_produto}`);
                    if (updatedRow) {
                        const newRowHtml = createProductRowHtml(payload.new);
                        updatedRow.outerHTML = newRowHtml; // Substitui o HTML da linha
                        tableBody.querySelector(`#product-row-${payload.new.id_produto}`).classList.add('new-appointment-highlight');
                    }
                } 
                else if (payload.eventType === 'DELETE') {
                    const deletedRow = tableBody.querySelector(`#product-row-${payload.old.id_produto}`);
                    if (deletedRow) {
                        deletedRow.remove();
                    }
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Conectado ao canal de produtos!');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Erro no canal Realtime:', err);
            }
        });
    return channel;
}


// --- INICIALIZAÇÃO E LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. DESATIVADO: O "Segurança" está desligado
    // const adminUser = await checkAdminAuth();
    // if (!adminUser) return; // Para a execução se não for admin

    // 2. SÓ RODA O CÓDIGO DA PÁGINA
    console.log("Admin (modo teste). Carregando produtos...");
    
    if (productModalElement) {
        productModalInstance = new bootstrap.Modal(productModalElement);
    } else {
        console.error("Elemento do Modal #productModal não encontrado.");
    }
    loadAndDisplayProducts();

    // 3. ADICIONA OS LISTENERS
 	if (addProductButton) {
 		addProductButton.addEventListener('click', () => {
 			clearProductForm(); 
 		});
 	}
 	document.addEventListener('click', async (event) => {
 		const target = event.target;
 		const editButton = target.closest('.btn-edit');
 		const deleteButton = target.closest('.btn-delete');
 		if (editButton) {
 			const productId = editButton.dataset.id;
 			clearProductForm(); 
 			const productData = await fetchProductDetails(productId); 
 			if (productData) { populateProductForm(productData); }
 			return; 
 		}
 		if (deleteButton) {
 			const productId = deleteButton.dataset.id;
 			const productName = deleteButton.closest('tr').querySelector('td:nth-child(2)').textContent; 
 			if (confirm(`Tem certeza que deseja EXCLUIR o produto "${productName}" (ID: ${productId})?`)) {
 				const success = await deleteProduct(productId); 
 				// Não precisa mais recarregar, o Realtime vai fazer isso
 			}
 			return;
 		}
 	});
 	if (productForm) {
 		productForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
 			saveProductButton.disabled = true; 
 			const productData = {
 				nome_produto: document.getElementById('nome_produto').value.trim(),
 				preco: parseFloat(document.getElementById('preco').value) || null,
 				quantidade_estoque: parseInt(document.getElementById('quantidade_estoque').value) || 0,
 				url_imagem: document.getElementById('url_imagem').value.trim() || null,
 				descricao: document.getElementById('descricao').value.trim() || null,
 				marca: document.getElementById('marca').value.trim() || null,
 				tipo_produto: document.getElementById('tipo_produto').value.trim() || null,
 			};
 			if (!productData.nome_produto || productData.preco === null || productData.quantidade_estoque === null) {
 				 alert('Por favor, preencha todos os campos obrigatórios (*).');
 				 saveProductButton.disabled = false;
 				 return;
 			}
 			const editingId = editProductIdInput.value; 
 			let success = false;
 			if (editingId) {
 				saveProductButton.textContent = 'Salvando Alterações...';
 				success = await updateProduct(editingId, productData);
 			} else {
 				saveProductButton.textContent = 'Adicionando Produto...';
 				success = await addProduct(productData);
 			}
 			if (success) {
 				productModalInstance.hide(); 
 				// Não precisa mais recarregar, o Realtime vai fazer isso
 			} else {
 				saveProductButton.disabled = false;
 				saveProductButton.textContent = editingId ? 'Salvar Alterações' : 'Salvar Produto';
 			}
        });
 	}
 	if (productModalElement) {
 		productModalElement.addEventListener('hidden.bs.modal', () => {
 			clearProductForm();
 		});
 	}

    // 4. NOVO: Inicia o "ouvinte" de Realtime
    listenForProductChanges();
});