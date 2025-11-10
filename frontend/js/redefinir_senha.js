// js/redefinir_senha.js

// Importa o cliente Supabase
import { supabase } from '../js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona os elementos da página
    const sendCodeForm = document.getElementById('sendCodeForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const section1 = document.getElementById('reset-section-1');
    const section2 = document.getElementById('reset-section-2');
    const backToStep1Button = document.getElementById('back-to-step1');

    // Variável para armazenar o token de recuperação (se houver)
    let recoveryToken = null;

    // --- LÓGICA DE CONTROLE DAS ETAPAS ---

    // Função para mostrar a etapa 2 (Redefinir Senha)
    const showResetForm = () => {
        section1.style.display = 'none';
        section2.style.display = 'block';
    };

    // Função para mostrar a etapa 1 (Enviar Email)
    const showRequestForm = () => {
        section1.style.display = 'block';
        section2.style.display = 'none';
    };

    // Verifica se a URL contém um token de recuperação
    // O Supabase envia o usuário de volta para esta página com um token na URL
    if (window.location.hash.includes('access_token=')) {
        // Extrai o token da URL
        const params = new URLSearchParams(window.location.hash.substring(1)); // Remove o '#'
        recoveryToken = params.get('access_token');
        
        // Se temos um token, pula direto para a Etapa 2
        if (recoveryToken) {
            console.log('Token de recuperação encontrado.');
            showResetForm();
        }
    } else {
        // Se não tem token, começa na Etapa 1
        showRequestForm();
    }

    // --- LÓGICA DOS FORMULÁRIOS ---

    // ETAPA 1: Enviar o link de recuperação
    if (sendCodeForm) {
        sendCodeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const button = e.target.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'ENVIANDO...';

            try {
                // Pede ao Supabase para enviar o e-mail de redefinição
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    // Diz ao Supabase para onde redirecionar o usuário após clicar no link
                    // (Deve ser esta mesma página)
                    redirectTo: window.location.origin + window.location.pathname,
                });

                if (error) throw error;

                alert("E-mail de recuperação enviado! Verifique sua caixa de entrada (e spam) e clique no link para redefinir sua senha.");
                
                // Mesmo que o e-mail tenha sido enviado, o usuário precisa
                // CLICAR NO LINK. Não o deixamos ir para a etapa 2 ainda.
                // A página será recarregada com o token *depois* que ele clicar.

            } catch (error) {
                console.error('Erro ao enviar e-mail de recuperação:', error.message);
                alert(`Erro: ${error.message}`);
            } finally {
                button.disabled = false;
                button.textContent = 'ENVIAR CÓDIGO';
            }
        });
    }

    // ETAPA 2: Redefinir a senha (após clicar no link do e-mail)
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('new_password').value;
            const confirmNewPassword = document.getElementById('confirm_new_password').value;
            const button = e.target.querySelector('button[type="submit"]');

            if (newPassword !== confirmNewPassword) {
                alert("As novas senhas não coincidem. Tente novamente.");
                return;
            }

            if (!recoveryToken) {
                // Isso não deveria acontecer se o fluxo estiver correto
                alert("Token de recuperação inválido. Por favor, solicite um novo link.");
                showRequestForm(); // Volta para a etapa 1
                return;
            }

            button.disabled = true;
            button.textContent = 'SALVANDO...';

            try {
                // Usa o token (que já está na sessão) para atualizar o usuário
                const { error } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (error) throw error;

                alert("Senha redefinida com sucesso! Você já pode fazer o login.");
                window.location.href = "login.html"; // Redireciona para a tela de login

            } catch (error) {
                console.error('Erro ao redefinir senha:', error.message);
                alert(`Erro ao salvar nova senha: ${error.message}`);
                button.disabled = false;
                button.textContent = 'SALVAR SENHA';
            }
        });
    }

    // Lógica para o botão de voltar da Etapa 2 para a Etapa 1
    if (backToStep1Button) {
        backToStep1Button.addEventListener('click', function(e) {
            e.preventDefault();
            showRequestForm();
        });
    }
});