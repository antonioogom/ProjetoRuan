// js/admin_login.js
// Este arquivo agora só existe para redirecionar
// ou caso alguém acesse o link antigo.

// CORRIGIDO: O caminho estava errado.
import { supabase } from '../js/supabaseClient.js';
import { checkAdminAuth } from './admin_auth.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o usuário já é um admin logado
    const adminUser = await checkAdminAuth();
    
    if (adminUser) {
        // Se for admin, manda direto pro dashboard
        console.log("Admin já logado. Redirecionando para o dashboard...");
        window.location.href = 'dashboard.html';
    } else {
        // Se não for admin (ou ninguém), manda para a tela de login unificada
        console.log("Nenhum admin logado. Redirecionando para o login principal...");
        window.location.href = '../usuario/login.html';
    }
});