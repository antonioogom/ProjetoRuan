// js/admin_agendamentos.js
// VERSÃO FINAL: Segurança Desativada + Imports Corretos + Realtime

import { supabase } from './supabaseClient.js'; 
// DESATIVADO: import { checkAdminAuth } from './admin_auth.js'; 

// ... (Todas as suas funções: formatDateTime, getStatusBadge, createAppointmentRowHtml, etc. continuam aqui) ...
// --- FUNÇÕES AUXILIARES ---
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Data inválida'; }
}
function getStatusBadge(status) {
    status = status ? status.toLowerCase() : 'desconhecido';
    switch (status) {
        case 'confirmado': return '<span class="badge bg-success">Confirmado</span>';
        case 'pendente': return '<span class="badge bg-warning text-dark">Pendente</span>';
        case 'cancelado': return '<span class="badge bg-danger">Cancelado</span>';
        case 'finalizado': return '<span class="badge bg-secondary">Finalizado</span>';
        default: return `<span class="badge bg-light text-dark">${status}</span>`;
    }
}
function createAppointmentRowHtml(ag) {
    const nomeCliente = ag.perfis?.nome_completo || 'Cliente não encontrado';
    const nomePet = ag.pets?.nome_pet || 'Pet não encontrado';
    const nomeServico = ag.servicos?.nome_servico || 'Serviço não encontrado';
    const nomeLoja = ag.lojas?.nome_loja || 'Loja não encontrada';

    return `
        <tr id="appointment-row-${ag.id_agendamento}">
            <td>${nomeCliente}</td>
            <td>${nomePet}</td>
            <td>${nomeServico}</td>
            <td>${nomeLoja}</td>
            <td>${formatDateTime(ag.data_hora_inicio)}</td>
            <td>${getStatusBadge(ag.status)}</td>
            <td>
                <button class="btn btn-sm btn-info btn-action btn-view" title="Ver Detalhes" data-id="${ag.id_agendamento}" data-bs-toggle="modal" data-bs-target="#appointmentDetailModal"><i class="bi bi-eye-fill"></i></button>
                <button class="btn btn-sm btn-warning btn-action btn-edit-status" title="Alterar Status" data-id="${ag.id_agendamento}"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-danger btn-action btn-cancel" title="Cancelar Agendamento" data-id="${ag.id_agendamento}" ${ag.status === 'cancelado' || ag.status === 'finalizado' ? 'disabled' : ''}><i class="bi bi-x-lg"></i></button>
            </td>
        </tr>`;
}

// --- LÓGICA PRINCIPAL ---
async function loadAndDisplayAppointments() {
    const tableBody = document.getElementById('appointments-table-body');
    const loadingRow = document.getElementById('loading-row-appointments');
    const noAppointmentsRow = document.getElementById('no-appointments-row');

    if (!tableBody || !loadingRow || !noAppointmentsRow) { return; }
    loadingRow.style.display = 'table-row';
    noAppointmentsRow.style.display = 'none';
    const existingRows = tableBody.querySelectorAll("tr:not(#loading-row-appointments):not(#no-appointments-row)");
    existingRows.forEach(row => row.remove());
    try {
        let { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select(`*, perfis(nome_completo), pets(nome_pet), servicos(nome_servico), lojas(nome_loja)`)
            .order('data_hora_inicio', { ascending: false }); 
        if (error) { throw error; }
        loadingRow.style.display = 'none';
        if (agendamentos && agendamentos.length > 0) {
            agendamentos.forEach(ag => {
                const rowHtml = createAppointmentRowHtml(ag); 
                tableBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        } else {
            noAppointmentsRow.style.display = 'table-row';
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error.message);
        loadingRow.style.display = 'none';
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro ao carregar: ${error.message}</td></tr>`;
    }
}
// --- FUNÇÕES PARA AÇÕES ---
async function showAppointmentDetails(appointmentId) {
    const modalBody = document.getElementById('appointmentDetailModalBody');
 	if(!modalBody) return;
 	modalBody.innerHTML = `<p class="text-center"><span class="spinner-border spinner-border-sm"></span> Carregando...</p>`;
 	try {
 		let { data: ag, error } = await supabase.from('agendamentos').select(`*, perfis(*), pets(*), servicos(*), lojas(*)`).eq('id_agendamento', appointmentId).single();
 		if (error) throw error;
 		if (ag) {
 			 modalBody.innerHTML = `
 				 <p><strong>Cliente:</strong> ${ag.perfis?.nome_completo || 'N/A'} (Tel: ${ag.perfis?.telefone || 'N/A'})</p>
 				 <p><strong>Pet:</strong> ${ag.pets?.nome_pet || 'N/A'} (Espécie: ${ag.pets?.especie || 'N/A'}, Raça: ${ag.pets?.raca || 'N/A'})</p>
 				 <p><strong>Serviço:</strong> ${ag.servicos?.nome_servico || 'N/A'}</p>
 				 <p><strong>Loja:</strong> ${ag.lojas?.nome_loja || 'N/A'}</p>
 				 <p><strong>Data/Hora:</strong> ${formatDateTime(ag.data_hora_inicio)}</p>
 				 <p><strong>Status Atual:</strong> ${getStatusBadge(ag.status)}</p>
 				 <p><strong>Observações Cliente:</strong> ${ag.observacoes_cliente || 'Nenhuma'}</p>`;
 		} else {
 			 modalBody.innerHTML = `<p class="text-danger">Agendamento não encontrado.</p>`;
 		}
 	} catch (error) {
 		 modalBody.innerHTML = `<p class="text-danger">Erro ao buscar detalhes: ${error.message}</p>`;
 	}
}
async function changeAppointmentStatus(appointmentId) {
    const newStatus = prompt(`Digite o novo status (Ex: confirmado, finalizado, cancelado):`);
 	 if (newStatus && ['confirmado', 'finalizado', 'cancelado', 'pendente'].includes(newStatus.toLowerCase())) {
 		 try {
 			 const { error } = await supabase.from('agendamentos').update({ status: newStatus.toLowerCase() }).eq('id_agendamento', appointmentId);
 			 if (error) throw error;
 			 alert('Status atualizado!');
 			 loadAndDisplayAppointments(); // Recarrega a lista
 		 } catch (error) {
 			 alert(`Erro ao atualizar status: ${error.message}`);
 		 }
 	} else if (newStatus !== null) { 
 		 alert('Status inválido. Use: confirmado, finalizado, cancelado ou pendente.');
 	}
}
async function cancelAppointment(appointmentId) {
    if (confirm(`Tem certeza que deseja CANCELAR o agendamento ID ${appointmentId}?`)) {
 		 try {
 			 const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id_agendamento', appointmentId);
 			 if (error) throw error;
 			 alert('Agendamento cancelado.');
 			 loadAndDisplayAppointments(); // Recarrega a lista
 		 } catch (error) {
 			 alert(`Erro ao cancelar: ${error.message}`);
 		 }
 	}
}
// --- Função para buscar e adicionar UMA linha ---
async function fetchAndDisplaySingleAppointment(appointmentId) {
    console.log(`Buscando dados completos para o novo agendamento: ${appointmentId}`);
    try {
        let { data: ag, error } = await supabase
            .from('agendamentos')
            .select(`*, perfis(nome_completo), pets(nome_pet), servicos(nome_servico), lojas(nome_loja)`)
            .eq('id_agendamento', appointmentId)
            .single();
        if (error) throw error;
        if (ag) {
            const tableBody = document.getElementById('appointments-table-body');
            const noAppointmentsRow = document.getElementById('no-appointments-row');
            if (noAppointmentsRow) noAppointmentsRow.style.display = 'none';
            const rowHtml = createAppointmentRowHtml(ag);
            tableBody.insertAdjacentHTML('afterbegin', rowHtml);
            const newRow = tableBody.querySelector(`#appointment-row-${ag.id_agendamento}`);
            if (newRow) {
                newRow.classList.add('new-appointment-highlight');
                setTimeout(() => newRow.classList.remove('new-appointment-highlight'), 3100);
            }
        }
    } catch (error) {
        console.error(`Erro ao buscar dados do novo agendamento: ${error.message}`);
    }
}
// --- Função para "escutar" o banco de dados ---
function listenForNewAppointments() {
    console.log("Ouvindo por novos agendamentos...");
    const channel = supabase
        .channel('public:agendamentos')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'agendamentos' 
            }, 
            (payload) => {
                console.log('Novo agendamento recebido!', payload.new);
                fetchAndDisplaySingleAppointment(payload.new.id_agendamento);
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Conectado ao canal de agendamentos!');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Erro no canal Realtime:', err);
            }
        });
    return channel;
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. DESATIVADO: O "Segurança" está desligado
    // const adminUser = await checkAdminAuth();
    // if (!adminUser) return; // Para a execução se não for admin

    // 2. SÓ CARREGA OS DADOS
    console.log("Admin (modo teste). Carregando agendamentos...");
    loadAndDisplayAppointments();

    // 3. ADICIONA OS LISTENERS
    document.addEventListener('click', (event) => {
        const target = event.target;
 	 	const viewButton = target.closest('.btn-view');
 	 	const editStatusButton = target.closest('.btn-edit-status');
 	 	const cancelButton = target.closest('.btn-cancel');
 	 	if (viewButton) {
 	 		showAppointmentDetails(viewButton.dataset.id);
 	 		return;
 	 	}
 	 	if (editStatusButton) {
 	 		changeAppointmentStatus(editStatusButton.dataset.id);
 	 		return;
 	 	}
 	 	if (cancelButton) {
 	 		cancelAppointment(cancelButton.dataset.id);
 	 		return;
 	 	}
    });

    // 4. Inicia o "ouvinte" de Realtime
    listenForNewAppointments();
});