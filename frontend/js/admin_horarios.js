// js/admin_horarios.js
// VERSÃO ATUALIZADA: Funcionalidade de Horário de Funcionamento Padrão adicionada
// Segurança continua DESATIVADO (para seu teste de login)

// CORRIGIDO: O caminho deve ser './'
import { supabase } from './supabaseClient.js';
// DESATIVADO: import { checkAdminAuth } from './admin_auth.js'; // IMPORTA O SEGURANÇA

// --- ELEMENTOS DO DOM (Antigos) ---
const blockDayForm = document.getElementById('blockDayForm');
const capacityManagementContainer = document.getElementById('capacityManagementContainer');
const storesSelectBlockDay = document.getElementById('block-store');
const blockedDaysList = document.getElementById('blockedDaysList');
const loadingCapacity = document.getElementById('loadingCapacity');
const loadingBlockedDays = document.getElementById('loadingBlockedDays');

// --- NOVO: ELEMENTOS DO DOM (Horário Padrão) ---
const lojaSelectHorarios = document.getElementById('loja-select-horarios');
const horariosFormContainer = document.getElementById('horarios-form-container');
const horariosForm = document.getElementById('horariosForm');
const horariosTbody = horariosForm.querySelector('tbody');
const lojaSelecionadaNome = document.getElementById('loja-selecionada-nome');
const saveHorariosButton = document.getElementById('saveHorariosButton');
const loadingHorariosSpinner = document.getElementById('loading-horarios-spinner');
const diasDaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

let storesData = [];
let servicesData = []; 
let currentLojaIdHorarios = null;


// --- FUNÇÕES AUXILIARES (Antigas) ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Evita problemas de fuso
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Data inválida';
    }
}

// --- LÓGICA DE BLOQUEIO (Antiga) ---
async function loadBlockedDays() {
    if (!blockedDaysList || !loadingBlockedDays) return;
    loadingBlockedDays.style.display = 'block';
    blockedDaysList.innerHTML = '';
    try {
        const { data, error } = await supabase
            .from('dias_bloqueados')
            .select(`*, lojas(nome_loja)`)
            .order('data_bloqueada', { ascending: false });
        if (error) throw error;
        loadingBlockedDays.style.display = 'none';
        if (data && data.length > 0) {
            data.forEach(block => {
                const storeName = block.lojas ? block.lojas.nome_loja : 'Todas as Lojas';
                const listItem = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${formatDate(block.data_bloqueada)}</strong> - ${storeName}
                            ${block.motivo ? `<br><small class="text-muted">${block.motivo}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-danger btn-unblock" data-block-id="${block.id_bloqueio}" title="Desbloquear Dia">
                            <i class="bi bi-trash"></i>
                        </button>
                    </li>`;
                blockedDaysList.innerHTML += listItem;
            });
        } else {
            blockedDaysList.innerHTML = '<li class="list-group-item text-muted">Nenhum dia bloqueado encontrado.</li>';
        }
    } catch (error) {
        console.error("Erro ao carregar dias bloqueados:", error.message);
        loadingBlockedDays.style.display = 'none';
        blockedDaysList.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar bloqueios.</li>';
    }
}
async function blockDay(event) {
    event.preventDefault();
    const dateInput = document.getElementById('block-date');
    const storeSelect = document.getElementById('block-store');
    const reasonInput = document.getElementById('block-reason');
    const button = blockDayForm.querySelector('button[type="submit"]');
    const date = dateInput.value;
    const storeId = storeSelect.value === 'ALL' ? null : parseInt(storeSelect.value);
    const reason = reasonInput.value.trim() || null;
    if (!date) { alert('Selecione uma data.'); return; }
    button.disabled = true;
    button.textContent = 'Bloqueando...';
    try {
        const { error } = await supabase.from('dias_bloqueados').insert([{ data_bloqueada: date, id_loja: storeId, motivo: reason }]);
        if (error) {
            if (error.code === '23505') { alert(`Erro: Este dia já está bloqueado para esta loja.`); }
            else { throw error; }
        } else {
            alert(`Dia bloqueado com sucesso!`);
            blockDayForm.reset(); 
            loadBlockedDays(); 
        }
    } catch (error) {
        alert(`Erro ao bloquear dia: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Bloquear Dia';
    }
}
async function unblockDay(blockId) {
    if (confirm('Tem certeza que deseja desbloquear este dia?')) {
        try {
            const { error } = await supabase.from('dias_bloqueados').delete().eq('id_bloqueio', blockId);
            if (error) throw error;
            alert('Dia desbloqueado!');
            loadBlockedDays(); 
        } catch (error) {
            alert(`Erro ao desbloquear dia: ${error.message}`);
        }
    }
}

// --- LÓGICA DE CAPACIDADE (Antiga) ---
async function loadCapacityRules() {
    if (!capacityManagementContainer || !loadingCapacity) return;
    loadingCapacity.style.display = 'block';
    capacityManagementContainer.innerHTML = ''; 
    try {
        const { data, error } = await supabase
            .from('servicos_loja_regras')
            .select(`*, lojas(nome_loja), servicos(nome_servico)`)
            .order('lojas(nome_loja)').order('servicos(nome_servico)');
        if (error) throw error;
        loadingCapacity.style.display = 'none';
        if (data && data.length > 0) {
            const rulesByStore = data.reduce((acc, rule) => {
                const storeName = rule.lojas?.nome_loja || 'Loja Desconhecida';
                if (!acc[storeName]) { acc[storeName] = []; }
                acc[storeName].push(rule);
                return acc;
            }, {});
            for (const storeName in rulesByStore) {
                const rules = rulesByStore[storeName];
                let storeCardHtml = `<div class="card mb-3"><div class="card-header"><strong>${storeName}</strong></div><ul class="list-group list-group-flush">`;
                rules.forEach(rule => {
                    storeCardHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${rule.servicos?.nome_servico || 'Serviço Desconhecido'}</span>
                            <div class="d-flex align-items-center">
                                <label for="capacity-${rule.id_regra}" class="form-label me-2 mb-0 small">Capacidade:</label>
                                <input type="number" min="0" value="${rule.capacidade_simultanea}" id="capacity-${rule.id_regra}" class="form-control form-control-sm me-2 capacity-input" style="width: 70px;" data-rule-id="${rule.id_regra}">
                                <div class="form-check form-switch me-2">
                                    <input class="form-check-input status-switch" type="checkbox" role="switch" id="status-${rule.id_regra}" ${rule.ativo ? 'checked' : ''} data-rule-id="${rule.id_regra}">
                                    <label class="form-check-label small" for="status-${rule.id_regra}">${rule.ativo ? 'Ativo' : 'Inativo'}</label>
                                </div>
                                <button class="btn btn-sm btn-primary btn-save-capacity" data-rule-id="${rule.id_regra}" disabled title="Salvar Alterações"><i class="bi bi-check-lg"></i></button>
                            </div>
                        </li>`;
                });
                storeCardHtml += `</ul></div>`;
                capacityManagementContainer.innerHTML += storeCardHtml;
            }
        } else {
             capacityManagementContainer.innerHTML = '<p class="text-muted">Nenhuma regra de capacidade definida.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar regras:", error.message);
        loadingCapacity.style.display = 'none';
        capacityManagementContainer.innerHTML = '<p class="text-danger">Erro ao carregar regras.</p>';
    }
}
async function saveCapacityChange(ruleId, newCapacity, newStatus) {
    const dataToUpdate = {};
    if (newCapacity !== null) { dataToUpdate.capacidade_simultanea = parseInt(newCapacity); }
    if (newStatus !== null) { dataToUpdate.ativo = newStatus; }
    if (Object.keys(dataToUpdate).length === 0) return; 

    const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
    const originalIcon = '<i class="bi bi-check-lg"></i>';
    if(saveButton){ saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; saveButton.disabled = true; }
    try {
        const { error } = await supabase.from('servicos_loja_regras').update(dataToUpdate).eq('id_regra', ruleId);
        if (error) throw error;
        if(saveButton){
             saveButton.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>'; 
             setTimeout(() => { saveButton.innerHTML = originalIcon; saveButton.disabled = true; }, 1500);
        }
        if (newStatus !== null) {
            const switchLabel = capacityManagementContainer.querySelector(`label[for="status-${ruleId}"]`);
            if (switchLabel) { switchLabel.textContent = newStatus ? 'Ativo' : 'Inativo'; }
        }
    } catch (error) {
        alert(`Erro ao salvar: ${error.message}`);
         if(saveButton){ saveButton.innerHTML = originalIcon; saveButton.disabled = false; }
    }
}

// --- ============================================= ---
// --- NOVO: LÓGICA DO HORÁRIO DE FUNCIONAMENTO ---
// --- ============================================= ---

/** Popula a tabela de horários com os 7 dias da semana */
function populateHorariosForm() {
    horariosTbody.innerHTML = ''; // Limpa o formulário
    for (let i = 0; i < 7; i++) { // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        const dia = diasDaSemana[i];
        const row = `
            <tr id="dia-${i}">
                <td class="fw-bold">${dia}</td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block" style="padding-left: 3.5em;">
                        <input class="form-check-input" type="checkbox" role="switch" id="ativo-${i}" data-dia="${i}">
                        <label class="form-check-label" for="ativo-${i}" id="label-ativo-${i}">Fechado</label>
                    </div>
                </td>
                <td><input type="time" class="form-control" id="abertura-${i}" data-dia="${i}" disabled></td>
                <td><input type="time" class="form-control" id="fechamento-${i}" data-dia="${i}" disabled></td>
                <td><input type="time" class="form-control" id="pausa-inicio-${i}" data-dia="${i}" disabled></td>
                <td><input type="time" class="form-control" id="pausa-fim-${i}" data-dia="${i}" disabled></td>
            </tr>
        `;
        horariosTbody.insertAdjacentHTML('beforeend', row);
    }
}

/** Carrega os horários salvos no Supabase para a loja selecionada */
async function loadHorarios(lojaId) {
    currentLojaIdHorarios = lojaId;
    loadingHorariosSpinner.style.display = 'block';
    horariosFormContainer.style.display = 'block';
    lojaSelecionadaNome.textContent = lojaSelectHorarios.options[lojaSelectHorarios.selectedIndex].text;
    
    // Popula o form com os 7 dias em branco
    populateHorariosForm();

    try {
        const { data, error } = await supabase
            .from('horarios_funcionamento')
            .select('*')
            .eq('id_loja', lojaId);

        if (error) throw error;

        // Preenche o formulário com os dados do banco
        if (data && data.length > 0) {
            data.forEach(horario => {
                const i = horario.dia_semana;
                const ativoCheckbox = document.getElementById(`ativo-${i}`);
                
                ativoCheckbox.checked = horario.ativo;
                // '|| ""' evita que 'null' apareça escrito nos inputs
                document.getElementById(`abertura-${i}`).value = horario.hora_abertura || "";
                document.getElementById(`fechamento-${i}`).value = horario.hora_fechamento || "";
                document.getElementById(`pausa-inicio-${i}`).value = horario.hora_inicio_pausa || "";
                document.getElementById(`pausa-fim-${i}`).value = horario.hora_fim_pausa || "";
                
                // Dispara manualmente o evento para habilitar/desabilitar os campos
                toggleDayInputs({ target: ativoCheckbox });
            });
        }
    } catch (error) {
        alert(`Erro ao carregar horários: ${error.message}`);
    } finally {
        loadingHorariosSpinner.style.display = 'none';
    }
}

/** Salva os horários do formulário no Supabase (Usa Upsert) */
async function saveHorarios(event) {
    event.preventDefault();
    if (!currentLojaIdHorarios) return;

    saveHorariosButton.disabled = true;
    saveHorariosButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

    try {
        const upsertData = [];
        for (let i = 0; i < 7; i++) {
            const ativo = document.getElementById(`ativo-${i}`).checked;
            const abertura = document.getElementById(`abertura-${i}`).value || null;
            const fechamento = document.getElementById(`fechamento-${i}`).value || null;
            const pausa_inicio = document.getElementById(`pausa-inicio-${i}`).value || null;
            const pausa_fim = document.getElementById(`pausa-fim-${i}`).value || null;

            upsertData.push({
                id_loja: currentLojaIdHorarios,
                dia_semana: i,
                ativo: ativo,
                hora_abertura: ativo ? abertura : null,
                hora_fechamento: ativo ? fechamento : null,
                hora_inicio_pausa: ativo ? pausa_inicio : null,
                hora_fim_pausa: ativo ? pausa_fim : null,
            });
        }

        // Upsert: Insere se não existir, atualiza se já existir (baseado no onConflict)
        const { error } = await supabase
            .from('horarios_funcionamento')
            .upsert(upsertData, { onConflict: 'id_loja, dia_semana' }); // Usa a chave única

        if (error) throw error;

        alert('Horários de funcionamento salvos com sucesso!');

    } catch (error) {
        alert(`Erro ao salvar horários: ${error.message}`);
    } finally {
        saveHorariosButton.disabled = false;
        saveHorariosButton.textContent = 'Salvar Horários';
    }
}

/** Habilita/desabilita os inputs de tempo baseado no checkbox "Ativo" */
function toggleDayInputs(event) {
    const checkbox = event.target;
    const dia = checkbox.dataset.dia;
    const inputs = [
        document.getElementById(`abertura-${dia}`),
        document.getElementById(`fechamento-${dia}`),
        document.getElementById(`pausa-inicio-${dia}`),
        document.getElementById(`pausa-fim-${dia}`)
    ];
    const label = document.getElementById(`label-ativo-${dia}`);

    if (checkbox.checked) {
        label.textContent = "Aberto";
        label.classList.add('text-success');
        inputs.forEach(input => input.disabled = false);
    } else {
        label.textContent = "Fechado";
        label.classList.remove('text-success');
        inputs.forEach(input => {
            input.disabled = true;
            input.value = ''; // Limpa os campos se estiver fechado
        });
    }
}


// --- INICIALIZAÇÃO (Modificada) ---
async function loadInitialData() {
    try {
        // Busca lojas (reutiliza para ambas as seções)
        const { data: stores, error: storesError } = await supabase.from('lojas').select('id_loja, nome_loja').order('nome_loja');
        if (storesError) throw storesError;
        
        storesData = stores || [];
        
        // Popula o select de "Bloquear Dia"
        if (storesSelectBlockDay) {
            storesSelectBlockDay.innerHTML = '<option value="ALL">Todas as Lojas</option>'; 
            storesData.forEach(store => {
                storesSelectBlockDay.innerHTML += `<option value="${store.id_loja}">${store.nome_loja}</option>`;
            });
        }

        // NOVO: Popula o select de "Horário Padrão"
        if (lojaSelectHorarios) {
            lojaSelectHorarios.innerHTML = '<option value="" selected disabled>Selecione uma loja...</option>';
            storesData.forEach(store => {
                lojaSelectHorarios.innerHTML += `<option value="${store.id_loja}">${store.nome_loja}</option>`;
            });
        }

        // Carrega as outras seções
        loadBlockedDays();
        loadCapacityRules();

    } catch (error) {
        alert("Erro ao carregar dados essenciais da página. Tente recarregar.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. "SEGURANÇA" DESATIVADO (como solicitado)
    // const adminUser = await checkAdminAuth();
    // if (!adminUser) return; // Para

    // 2. SÓ CARREGA OS DADOS E LISTENERS
    console.log("Admin (modo teste). Carregando dados de horários...");
    loadInitialData();

    // --- Listeners da Seção "Bloquear Dia" (Antigo) ---
    if (blockDayForm) {
        blockDayForm.addEventListener('submit', blockDay);
    }
    if (blockedDaysList) {
        blockedDaysList.addEventListener('click', (event) => {
            const unblockButton = event.target.closest('.btn-unblock');
            if (unblockButton) { unblockDay(unblockButton.dataset.blockId); }
        });
    }

    // --- Listeners da Seção "Capacidade" (Antigo) ---
    if (capacityManagementContainer) {
        capacityManagementContainer.addEventListener('input', (event) => {
            const target = event.target;
 			if (target.classList.contains('capacity-input') || target.classList.contains('status-switch')) {
 				const ruleId = target.dataset.ruleId;
 				const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
 				if (saveButton) saveButton.disabled = false;
 			}
        });
         capacityManagementContainer.addEventListener('click', (event) => {
            const saveButton = event.target.closest('.btn-save-capacity');
 			 if (saveButton && !saveButton.disabled) {
 				 const ruleId = saveButton.dataset.ruleId;
 				 const capacityInput = capacityManagementContainer.querySelector(`#capacity-${ruleId}`);
 				 const statusSwitch = capacityManagementContainer.querySelector(`#status-${ruleId}`);
 				 const newCapacity = capacityInput ? parseInt(capacityInput.value) : null;
 				 const newStatus = statusSwitch ? statusSwitch.checked : null;
 				 saveCapacityChange(ruleId, newCapacity, newStatus);
 			 }
         });
    }

    // --- NOVO: Listeners da Seção "Horário Padrão" ---
    if (lojaSelectHorarios) {
        lojaSelectHorarios.addEventListener('change', (e) => {
            const lojaId = e.target.value;
            if (lojaId) {
                loadHorarios(lojaId);
            } else {
                horariosFormContainer.style.display = 'none';
            }
        });
    }
    if (horariosForm) {
        horariosForm.addEventListener('submit', saveHorarios);
        
        // Adiciona listener para todos os checkboxes de "ativo"
        // (Usando delegação de evento no formulário)
        horariosForm.addEventListener('change', (e) => {
            if (e.target.classList.contains('form-check-input')) {
                toggleDayInputs(e);
            }
        });
    }
});