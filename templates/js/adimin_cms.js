// js/admin_cms.js
// Lógica para o editor visual (CMS)
// CORRIGIDO: Erro de sintaxe na linha 121

import { supabase } from './supabaseClient.js';
// (A segurança 'checkAdminAuth' está desativada no HTML por enquanto)

// --- Elementos do Modal ---
const editBannerModal = document.getElementById('editBannerModal');
const btnEditBanner = document.getElementById('btn-edit-banner');
const saveBannerButton = document.getElementById('saveBannerButton');
const modalLoadingSpinner = document.getElementById('modal-loading-spinner');
const modalFormContent = document.getElementById('modal-form-content');

// Inputs do formulário
const bannerImgUrlInput = document.getElementById('banner_img_url');
const bannerTituloInput = document.getElementById('banner_titulo');

/**
 * Carrega os dados atuais do banner do Supabase para o formulário
 */
async function loadBannerData() {
    // Mostra o spinner e esconde o form
    modalLoadingSpinner.style.display = 'block';
    modalFormContent.style.display = 'none';

    try {
        // Busca os dois valores da tabela
        let { data, error } = await supabase
            .from('cms_content')
            .select('element_id, content_value')
            .in('element_id', ['banner_principal_img', 'banner_principal_titulo']);
        
        if (error) throw error;

        // Preenche os campos do formulário
        if (data) {
            const imgData = data.find(el => el.element_id === 'banner_principal_img');
            const tituloData = data.find(el => el.element_id === 'banner_principal_titulo');

            if (imgData) {
                bannerImgUrlInput.value = imgData.content_value;
            }
            if (tituloData) {
                bannerTituloInput.value = tituloData.content_value;
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar conteúdo do banner:", error.message);
        alert("Erro ao carregar dados. Verifique o console.");
    } finally {
        // Esconde o spinner e mostra o form
        modalLoadingSpinner.style.display = 'none';
        modalFormContent.style.display = 'block';
    }
}

/**
 * Salva os novos dados do banner no Supabase
 */
async function saveBannerData() {
    const newImgUrl = bannerImgUrlInput.value;
    const newTitulo = bannerTituloInput.value;

    saveBannerButton.disabled = true;
    saveBannerButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

    try {
        const dataToUpsert = [
            {
                element_id: 'banner_principal_img',
                content_type: 'image_url',
                content_value: newImgUrl,
                updated_at: new Date()
            },
            {
                element_id: 'banner_principal_titulo',
                content_type: 'text',
                content_value: newTitulo,
                updated_at: new Date()
            }
        ];

        // Upsert: Atualiza se existir, insere se não existir
        const { error } = await supabase
            .from('cms_content')
            .upsert(dataToUpsert, { onConflict: 'element_id' });

        if (error) throw error;

        alert('Banner salvo com sucesso!');
        
        // Fecha o modal (Bootstrap)
        const modalInstance = bootstrap.Modal.getInstance(editBannerModal);
        modalInstance.hide();
        
        // Recarrega o iframe para mostrar a alteração
        const iframe = document.querySelector('iframe');
        if (iframe) {
            iframe.src = iframe.src; 
        }

    } catch (error) {
        console.error("Erro ao salvar conteúdo do banner:", error.message);
        alert("Erro ao salvar. Verifique o console.");
    } finally {
        saveBannerButton.disabled = false;
        saveBannerButton.textContent = 'Salvar Alterações';
    }
}

// --- Event Listeners ---
if (editBannerModal) {
    // Quando o modal for aberto, carrega os dados
    editBannerModal.addEventListener('show.bs.modal', () => {
        loadBannerData();
    });
}

if (saveBannerButton) {
    // Quando o botão Salvar for clicado
    // CORRIGIDO: Removido o '_' extra
    saveBannerButton.addEventListener('click', () => {
        saveBannerData();
    });
}