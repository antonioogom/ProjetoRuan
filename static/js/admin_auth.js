// js/admin_auth.js
// Este é o "Segurança" que vai proteger todas as suas páginas de admin.

// CORRIGIDO: O caminho deve ser './'
import { supabase } from './supabaseClient.js';

export async function checkAdminAuth() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Erro ao pegar sessão:', sessionError);
        window.location.href = '../usuario/login.html';
        return null;
    }

    if (!session) {
        console.log("Nenhum usuário logado. Redirecionando...");
        window.location.href = '../usuario/login.html';
        return null;
    }

    const userId = session.user.id;

    // Busca o perfil para verificar o 'role'
    const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', userId)
        .single();

    if (perfilError) {
        console.error('Erro ao buscar perfil do admin:', perfilError);
        alert('Erro: Não foi possível verificar seu perfil.');
        await supabase.auth.signOut();
        window.location.href = '../usuario/login.html';
        return null;
    }

    if (perfil && perfil.role === 'admin') {
        // SUCESSO! É um admin.
        console.log('Acesso de admin verificado.');
        return session.user; 
    } else {
        // NÃO É ADMIN! Expulsa.
        console.warn('Acesso negado: Usuário não é admin.');
        alert('Acesso negado. Esta área é restrita para administradores.');
        await supabase.auth.signOut();
        window.location.href = '../usuario/login.html';
        return null;
    }
}