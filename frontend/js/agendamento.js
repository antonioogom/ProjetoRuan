import { supabase } from './supabaseClient.js';

// --- ELEMENTOS DO DOM ---
const wizard = document.getElementById('agendamento-wizard');
const steps = wizard ? wizard.querySelectorAll('.step') : [];
const progressBar = document.getElementById('step-progressbar');
const serviceSelect = document.getElementById('service-select');
const nextButtonStep1 = document.getElementById('nextButtonStep1');
const storeSelect = document.getElementById('store-select');
const backButtonStep2 = document.getElementById('backButtonStep2');
const nextButtonStep2 = document.getElementById('nextButtonStep2');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const timeSlotsContainer = document.getElementById('time-slots-container');
const backButtonStep3 = document.getElementById('backButtonStep3');
const nextButtonStep3 = document.getElementById('nextButtonStep3');
const prevMonthButton = document.getElementById('prevMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const petInfoForm = document.getElementById('pet-info-form');
const selectPetElement = document.getElementById('select-pet');
const newPetFieldsDiv = document.getElementById('new-pet-fields');
const nomePetInput = document.getElementById('nome_pet');
const especieRacaInput = document.getElementById('especie_raca');
const porteSelect = document.getElementById('porte');
const observacoesInput = document.getElementById('observacoes');
const backButtonStep4 = document.getElementById('backButtonStep4');
const confirmationSummary = document.getElementById('confirmation-summary');
const backButtonStep5 = document.getElementById('backButtonStep5');
const confirmButton = document.getElementById('confirmButton');

// --- ESTADO DO AGENDAMENTO ---
let currentStep = 1;
const appointmentData = {
    loja_id: null, loja_nome: null,
    servico_id: null, servico_nome: null,
    data: null, horario: null,
    pet_info: {},
    selected_pet_id: null,
    selected_pet_name: null,
    cliente_id: null, cliente_email: null
};

// ======================================================
// REGRAS DE NEGÓCIO ATUALIZADAS COM SUAS LOJAS REAIS
// ======================================================
const allStoreNames = [
    "Mooca",
    "Tatuapé",
    "Ipiranga",
    "Santos"
];

// Lista de lojas que NÃO TÊM o serviço
const serviceStoreExceptions = {
    // Baseado nas suas regras: Vet não tem na Loja 4 (Santos)
    "Veterinário": ["Santos"], 
    
    // Baseado nas suas regras: Piscina só tem na Loja 5 (Mega Pet - que não está na sua lista de 4)
    // Vou assumir que SÓ A MOOCA (Loja 1) tem.
    "Natação (Piscina)": ["Tatuapé", "Ipiranga", "Santos"],
    
    // Baseado nas suas regras: Hotel SÓ TEM na Loja 1 (Mooca) e 5
    "Hotel - Diária": ["Tatuapé", "Ipiranga", "Santos"] 
};
let storeNameIdMap = {};

// --- FUNÇÕES DE NAVEGAÇÃO E UI ---
function showStep(stepNumber) {
    currentStep = stepNumber;
    steps.forEach((step, index) => {
        step.classList.toggle('active', (index + 1) === stepNumber);
    });
    updateProgressBar();
}

function updateProgressBar() {
    // Adicionado verificador para não quebrar em outras páginas
    if (!progressBar) return; 
    const progressPercentage = ((currentStep - 1) / 4) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `Passo ${currentStep} de 5`;
    if (currentStep === 5) progressBar.style.width = `100%`;
}

// --- LÓGICA DE VERIFICAÇÃO DE LOGIN ---
async function checkUserSession() {
    if (appointmentData.cliente_id) return true;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            appointmentData.cliente_id = session.user.id;
            appointmentData.cliente_email = session.user.email;
            return true;
        } else {
            alert("Você precisa estar logado para escolher um horário.\n\nVocê será redirecionado para a página de login.");
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            // ======================================================
            // CORREÇÃO DO ERRO 404 DO LOGIN
            // O caminho precisa subir um nível (../)
            // ======================================================
            window.location.href = '../usuario/login.html'; 
            return false;
        }
    } catch (error) {
        alert("Erro ao verificar sua sessão. Tente novamente.");
        return false;
    }
}

// --- FUNÇÕES DE CARREGAMENTO DE DADOS ---
async function loadServices() {
    serviceSelect.disabled = true;
    const { data, error } = await supabase.from('servicos').select('id_servico, nome_servico').order('nome_servico');
    if (error) {
        console.error("Erro ao carregar serviços (Verifique o RLS):", error);
        serviceSelect.innerHTML = `<option value="" disabled selected>Erro ao carregar serviços: ${error.message}</option>`;
        return;
    }
    if (!data || data.length === 0) {
        console.warn("Serviços retornados: Lista vazia. Verifique as permissões RLS (Row Level Security) da tabela 'public.servicos'.");
        serviceSelect.innerHTML = `<option value="" disabled selected>Nenhum serviço encontrado (Verifique RLS).</option>`;
        return;
    }
    serviceSelect.innerHTML = '<option value="" disabled selected>Selecione o serviço...</option>';
    data.forEach(service => {
        serviceSelect.innerHTML += `<option value="${service.id_servico}" data-nome="${service.nome_servico}">${service.nome_servico}</option>`;
    });
    serviceSelect.disabled = false;
}

async function loadStores() {
    const { data, error } = await supabase.from('lojas').select('id_loja, nome_loja');
    if (error) { 
        console.error("Erro ao carregar lojas (Verifique o RLS):", error); 
        return; 
    }
    if (!data || data.length === 0) {
        console.warn("Lojas retornadas: Lista vazia. Verifique as permissões RLS (Row Level Security) da tabela 'public.lojas'.");
        return;
    }
    storeNameIdMap = {};
    data.forEach(store => {
        storeNameIdMap[store.nome_loja] = store.id_loja;
    });
    console.log("Mapeamento de Lojas carregado:", storeNameIdMap);
}

async function populateStoreOptions() {
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = selectedOption.dataset.nome;
    if (!serviceName) return;
    appointmentData.servico_id = selectedOption.value;
    appointmentData.servico_nome = serviceName;
    
    let allowedStoreNames;
    if (serviceStoreExceptions[serviceName]) {
        const exceptions = serviceStoreExceptions[serviceName];
        allowedStoreNames = allStoreNames.filter(storeName => !exceptions.includes(storeName));
    } else {
        allowedStoreNames = allStoreNames;
    }
    
    storeSelect.innerHTML = '<option value="" disabled selected>Selecione a unidade...</option>';
    
    if (Object.keys(storeNameIdMap).length === 0) {
        console.warn("Mapeamento de lojas (storeNameIdMap) está vazio. Tentando carregar de novo...");
        await loadStores(); 
        if (Object.keys(storeNameIdMap).length === 0) {
             console.error("Falha ao carregar mapeamento de lojas. Verifique o RLS da tabela 'public.lojas'.");
             storeSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar lojas.</option>';
             storeSelect.disabled = true;
             return;
        }
    }

    const allowedIds = allowedStoreNames.map(nome => storeNameIdMap[nome]).filter(id => id !== undefined); 

    if (allowedIds.length === 0) {
        storeSelect.innerHTML = '<option value="" disabled selected>Nenhuma loja oferece este serviço.</option>';
        storeSelect.disabled = true;
        return;
    }
    
    const { data: lojas, error } = await supabase
        .from('lojas')
        .select('id_loja, nome_loja')
        .in('id_loja', allowedIds)
        .order('nome_loja');

    if (error) {
        console.error("Erro ao filtrar lojas:", error);
        storeSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar lojas</option>';
        storeSelect.disabled = true;
        return;
    }
    lojas.forEach(store => {
        storeSelect.innerHTML += `<option value="${store.id_loja}" data-nome="${store.nome_loja}">${store.nome_loja}</option>`;
    });
    storeSelect.disabled = false;
    nextButtonStep2.disabled = true;
}

async function loadUserPets() {
    if (!selectPetElement || !appointmentData.cliente_id) return; 
    selectPetElement.disabled = true;
    selectPetElement.innerHTML = '<option value="NEW">-- Cadastrar Novo Pet --</option><option value="" disabled>Carregando...</option>';
    try {
        const { data: userPets, error } = await supabase.from('pets').select('id_pet, nome_pet, raca, porte').eq('id_tutor', appointmentData.cliente_id).order('nome_pet');
        if (error) throw error;
        selectPetElement.innerHTML = '<option value="NEW" selected>-- Cadastrar Novo Pet --</option>';
        if (userPets && userPets.length > 0) {
            userPets.forEach(pet => {
                selectPetElement.innerHTML += `<option value="${pet.id_pet}" data-raca="${pet.raca || ''}" data-porte="${pet.porte || ''}">${pet.nome_pet} (${pet.raca || 'SRD'})</option>`;
            });
        } else {
             selectPetElement.innerHTML += '<option value="" disabled>Nenhum pet cadastrado.</option>';
        }
        selectPetElement.disabled = false;
        handlePetSelectionChange(); 
    } catch (error) {
        console.error("Erro ao carregar pets do usuário (Verifique o RLS):", error.message);
        selectPetElement.innerHTML = '<option value="NEW">-- Cadastrar Novo Pet --</option><option value="" disabled>Erro ao carregar pets</option>';
        selectPetElement.disabled = false;
        handlePetSelectionChange();
    }
}

// --- LÓGICA DO CALENDÁRIO E HORÁRIOS ---
let currentCalendarDate = new Date();
function renderCalendar() {
    if (!calendarGrid) return; // Garante que o código não quebre em outras páginas
    const month = currentCalendarDate.getMonth();
    const year = currentCalendarDate.getFullYear();
    calendarMonthYear.textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = ''; 
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    weekDays.forEach(day => { calendarGrid.innerHTML += `<div class="calendar-day-name">${day}</div>`; });
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.innerHTML += '<div></div>'; }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date();
        const date = new Date(dateStr + "T00:00:00");
        let classes = "calendar-day";
        if (date < new Date(today.setHours(0,0,0,0))) { classes += " disabled"; } else { classes += " available"; }
        calendarGrid.innerHTML += `<div class="${classes}" data-date="${dateStr}" onclick="selectDate(this.dataset.date)">${day}</div>`;
    }
}

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset, 1);
    renderCalendar();
    timeSlotsContainer.innerHTML = '<p class="text-muted text-center mt-5">Selecione uma data para ver os horários.</p>';
}

async function fetchAvailableSlots(lojaId, servicoId, dateStr) {
    timeSlotsContainer.innerHTML = '<div class="text-center p-5"><span class="spinner-border spinner-border-sm main-purple-text"></span> Buscando horários...</div>';
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/horarios-disponiveis?loja_id=${lojaId}&servico_id=${servicoId}&data=${dateStr}`);
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Erro ${response.status} do servidor.`);
        }
        const slots = await response.json();
        displayAvailableSlots(slots);
    } catch (error) {
        console.error("Erro ao buscar horários da API:", error);
        if (error.message.includes('Failed to fetch')) {
             timeSlotsContainer.innerHTML = `<p class="text-danger text-center mt-5">Não foi possível conectar ao servidor de agendamento. O backend Python está rodando?</p>`;
        } else {
             timeSlotsContainer.innerHTML = `<p class="text-danger text-center mt-5">Erro ao buscar horários: ${error.message}</p>`;
        }
    }
}

function displayAvailableSlots(slots) {
    timeSlotsContainer.innerHTML = '';
    if (!slots || slots.length === 0) {
        timeSlotsContainer.innerHTML = '<p class="text-muted text-center mt-5">Nenhum horário disponível para este dia.</p>';
        return;
    }
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';
    slots.forEach(timeStr => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-group-item list-group-item-action text-center time-slot';
        button.textContent = timeStr;
        button.onclick = () => selectTimeSlot(timeStr, button);
        listGroup.appendChild(button);
    });
    timeSlotsContainer.appendChild(listGroup);
}

async function selectDate(dateStr) {
    const isLoggedIn = await checkUserSession();
    if (!isLoggedIn) return; 
    appointmentData.data = dateStr;
    appointmentData.horario = null;
    nextButtonStep3.disabled = true;
    document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.classList.add('selected');
    fetchAvailableSlots(appointmentData.loja_id, appointmentData.servico_id, dateStr);
}

function selectTimeSlot(timeStr, buttonElement) {
    appointmentData.horario = timeStr;
    document.querySelectorAll('.time-slot.selected').forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    nextButtonStep3.disabled = false;
}

// --- LÓGICA DO PASSO 4 (Infos do Pet) e 5 (Confirmação) ---
function handlePetSelectionChange() {
    if (!selectPetElement || !newPetFieldsDiv) return;
    const selectedValue = selectPetElement.value;
    if (selectedValue === 'NEW') {
        newPetFieldsDiv.style.display = 'block';
        nomePetInput.required = true;
        especieRacaInput.required = true;
    } else {
        newPetFieldsDiv.style.display = 'none';
        nomePetInput.required = false;
        especieRacaInput.required = false;
    }
}

function handlePetInfoSubmit(event) {
    event.preventDefault();
    const selectedPetOption = selectPetElement.value;
    if (selectedPetOption === 'NEW') {
        const formData = new FormData(petInfoForm);
        appointmentData.pet_info = Object.fromEntries(formData.entries());
        if (!appointmentData.pet_info.nome_pet || !appointmentData.pet_info.especie_raca) {
            alert('Por favor, preencha o Nome e a Espécie/Raça do novo pet.');
            return;
        }
        appointmentData.selected_pet_id = 'NEW';
        appointmentData.selected_pet_name = appointmentData.pet_info.nome_pet;
    } else if (selectedPetOption) {
        appointmentData.selected_pet_id = parseInt(selectedPetOption);
        const selectedOptionElement = selectPetElement.options[selectPetElement.selectedIndex];
        appointmentData.selected_pet_name = selectedOptionElement.text.split(' (')[0];
        appointmentData.pet_info = { observacoes: observacoesInput.value.trim() || null };
    } else {
        alert("Por favor, selecione um pet ou cadastre um novo.");
        return;
    }
    populateConfirmation();
    showStep(5);
}

async function saveNewPet(petDetails) {
    if (!appointmentData.cliente_id) throw new Error("ID do cliente não encontrado.");
    const newPetData = {
        id_tutor: appointmentData.cliente_id,
        nome_pet: petDetails.nome_pet,
        especie: petDetails.especie_raca?.split(',')[0]?.trim() || 'Não informado',
        raca: petDetails.especie_raca?.split(',')[1]?.trim() || petDetails.especie_raca || 'SRD',
        porte: petDetails.porte || null,
        observacoes: petDetails.observacoes || null
    };
    try {
        const { data: insertedPet, error } = await supabase.from('pets').insert([newPetData]).select('id_pet').single();
        if (error) throw error;
        return insertedPet.id_pet;
    } catch (error) {
        console.error("Erro ao salvar novo pet:", error.message);
        alert(`Erro ao salvar os dados do novo pet: ${error.message}.`);
        return null;
    }
}

function populateConfirmation() {
    if (!confirmationSummary) return;
    if (!appointmentData.loja_nome) appointmentData.loja_nome = storeSelect.options[storeSelect.selectedIndex]?.text;
    if (!appointmentData.servico_nome) appointmentData.servico_nome = serviceSelect.options[serviceSelect.selectedIndex]?.text;
    const displayDate = new Date(appointmentData.data + 'T' + appointmentData.horario).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let petNameForSummary = appointmentData.selected_pet_name || 'Pet não informado';
    confirmationSummary.innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item"><strong>Loja:</strong> ${appointmentData.loja_nome || 'N/A'}</li>
            <li class="list-group-item"><strong>Serviço:</strong> ${appointmentData.servico_nome || 'N/A'}</li>
            <li class="list-group-item"><strong>Data/Hora:</strong> ${displayDate}</li>
            <li class="list-group-item"><strong>Pet:</strong> ${petNameForSummary}</li>
            <li class="list-group-item"><strong>Observações:</strong> ${appointmentData.pet_info.observacoes || 'Nenhuma'}</li>
        </ul>
        <hr>
        <p class="text-center text-muted small">Agendando como: ${appointmentData.cliente_email || 'Usuário não identificado'}</p>
    `;
}

async function confirmAppointment() {
    if (confirmButton) { confirmButton.disabled = true; confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Confirmando...'; }
    let finalPetId = null;
    try {
        if (!appointmentData.cliente_id) throw new Error("Sessão expirada.");
        if (appointmentData.selected_pet_id === 'NEW') {
            finalPetId = await saveNewPet(appointmentData.pet_info);
            if (!finalPetId) throw new Error("Falha ao salvar novo pet. Agendamento cancelado.");
        } else {
            finalPetId = appointmentData.selected_pet_id;
        }
        if (!finalPetId) throw new Error("Não foi possível identificar o pet.");
        const payload = {
            id_cliente: appointmentData.cliente_id,
            id_pet: finalPetId,
            id_loja: appointmentData.loja_id,
            id_servico: appointmentData.servico_id,
            data_hora_inicio: `${appointmentData.data}T${appointmentData.horario}`,
            observacoes_cliente: appointmentData.pet_info.observacoes || null
        };
        const response = await fetch('http://127.0.0.1:5000/api/agendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Erro ${response.status}.`);
        }
        alert(`Agendamento realizado com sucesso para ${appointmentData.selected_pet_name || 'seu pet'}!`);
        window.location.href = '../usuario/meus_agendamentos.html'; // Corrigido para ../
    } catch (error) {
        console.error("Erro ao confirmar agendamento:", error);
        alert(`Não foi possível confirmar o agendamento: ${error.message}`);
         if (confirmButton) { confirmButton.disabled = false; confirmButton.textContent = 'Confirmar Agendamento'; }
         showStep(4);
    }
}

// --- INICIALIZAÇÃO E EVENT LISTENERS GERAIS ---
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se estamos na página de agendamento
    if (wizard) { 
        try {
            showStep(1);
            await Promise.all([
                loadServices(),
                loadStores()
            ]);
        } catch(error) {
             console.error("Erro na inicialização:", error);
             if (wizard) wizard.innerHTML = `<div class="alert alert-danger">Erro ao carregar agendamento. Tente recarregar.</div>`;
        }
        
        serviceSelect?.addEventListener('change', async () => {
            await populateStoreOptions();
            nextButtonStep1.disabled = false;
        });
        nextButtonStep1?.addEventListener('click', () => showStep(2));
        storeSelect?.addEventListener('change', () => {
            const selectedOption = storeSelect.options[storeSelect.selectedIndex];
            appointmentData.loja_id = selectedOption.value;
            appointmentData.loja_nome = selectedOption.dataset.nome;
            nextButtonStep2.disabled = false;
        });
        backButtonStep2?.addEventListener('click', () => showStep(1));
        nextButtonStep2?.addEventListener('click', () => {
            renderCalendar();
            timeSlotsContainer.innerHTML = '<p class="text-muted text-center mt-5">Selecione uma data para ver os horários.</p>';
            nextButtonStep3.disabled = true;
            showStep(3);
        });
        backButtonStep3?.addEventListener('click', () => showStep(2));
        nextButtonStep3?.addEventListener('click', async () => {
            const isLoggedIn = await checkUserSession();
            if (!isLoggedIn) return; 
            await loadUserPets(); 
            showStep(4);
        });
        prevMonthButton?.addEventListener('click', () => changeMonth(-1));
        nextMonthButton?.addEventListener('click', () => changeMonth(1));
        backButtonStep4?.addEventListener('click', () => showStep(3));
        petInfoForm?.addEventListener('submit', handlePetInfoSubmit);
        selectPetElement?.addEventListener('change', handlePetSelectionChange);
        backButtonStep5?.addEventListener('click', () => showStep(4));
        confirmButton?.addEventListener('click', confirmAppointment);
    }
});

// Funções Globais (Necessárias para onclick no HTML)
window.selectDate = selectDate;