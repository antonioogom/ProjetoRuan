// js/admin_dashboard.js
// VERSÃO COM ESTATÍSTICAS REAIS
// SEGURANÇA DESATIVADO PARA TESTE

import { supabase } from './supabaseClient.js';
// DESATIVADO: import { checkAdminAuth } from './admin_auth.js'; 

// Função para buscar e exibir os números
async function loadDashboardStats() {
    console.log("Buscando estatísticas do dashboard...");

    try {
        // 1. Buscar Agendamentos Pendentes
        const { count: pendingCount, error: pendingError } = await supabase
            .from('agendamentos')
            .select('id_agendamento', { count: 'exact', head: true }) 
            .eq('status', 'pendente');

        if (pendingError) throw pendingError;
        document.getElementById('stat-pending-count').textContent = pendingCount !== null ? pendingCount : 0;

        // 2. Buscar Total de Produtos
        const { count: productCount, error: productError } = await supabase
            .from('produtos')
            .select('id_produto', { count: 'exact', head: true });
        
        if (productError) throw productError;
        document.getElementById('stat-product-count').textContent = productCount !== null ? productCount : 0;

        // 3. Buscar Total de Clientes (perfis que NÃO são 'admin')
        const { count: customerCount, error: customerError } = await supabase
            .from('perfis')
            .select('id', { count: 'exact', head: true })
            .neq('role', 'admin'); // 'neq' = Not Equal (Diferente de)

        if (customerError) throw customerError;
        document.getElementById('stat-customer-count').textContent = customerCount !== null ? customerCount : 0;

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error.message);
        document.getElementById('stat-pending-count').textContent = 'Erro';
        document.getElementById('stat-product-count').textContent = 'Erro';
        document.getElementById('stat-customer-count').textContent = 'Erro';
    }
}

// Função principal de inicialização
async function initDashboard() {
    // 1. DESATIVADO: O "Segurança" está desligado
    // const adminUser = await checkAdminAuth();
    // if (!adminUser) return; // Para a execução se não for admin

    // 2. O USUÁRIO É ADMIN. Carrega as estatísticas.
    console.log(`Bem-vindo, Admin (Modo de Teste)`);
    loadDashboardStats();
}

document.addEventListener('DOMContentLoaded', initDashboard);