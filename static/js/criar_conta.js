// js/criar_conta.js

// Importa o cliente Supabase
// ATENÇÃO: O caminho '../js/supabaseClient.js' é INCORRETO. 
// O caminho correto é './supabaseClient.js' pois ambos estão na pasta 'js/'.
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const criarContaForm = document.getElementById('criarContaForm');
    const submitButton = criarContaForm.querySelector('button[type="submit"]');

    // 1. Lógica para o formulário de criação de conta
    if (criarContaForm) {
        criarContaForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão

            // Pega os valores do formulário
            const nome = document.getElementById('nome').value.trim(); // Trim adicionado para segurança
            const email = document.getElementById('email').value.trim(); // Trim adicionado
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar_senha').value;

            // Validação 1: Senhas são iguais?
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem. Por favor, tente novamente.');
                return; // Para a execução
            }

            // Validação 2: Nome não está vazio?
            if (nome === '') {
                alert('Por favor, preencha seu nome completo.');
                return;
            }

            // Desativa o botão
            submitButton.disabled = true;
            submitButton.textContent = 'CRIANDO CONTA...';

            try {
                // Tenta criar o novo usuário no Supabase Auth
                // NOTE: Se o supabaseClient.js falhar, esta linha dará erro, resultando no MOCK mode.
                const { error } = await supabase.auth.signUp({
                    email: email,
                    password: senha,
                    options: {
                        // IMPORTANTE: Salva o nome do usuário nos metadados
                        data: {
                            nome_completo: nome 
                        }
                    }
                });

                if (error) {
                    // Se o Supabase retornar um erro
                    throw error;
                }

                // Sucesso!
                alert('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar sua conta antes de fazer o login.');
                
                // Redireciona para a página de login
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Erro ao criar conta:', error.message);
                
                if (error.message.includes("User already registered")) {
                    alert("Este e-mail já está cadastrado. Tente fazer login.");
                } else if (error.message.includes("password should be at least 6 characters")) {
                    alert("Sua senha deve ter pelo menos 6 caracteres.");
                } else {
                    alert(`Erro ao criar conta: ${error.message}`);
                }
            } finally {
                // Reativa o botão
                submitButton.disabled = false;
                submitButton.textContent = 'CRIAR CONTA';
            }
        });
    }

    // 2. Lógica para mostrar/esconder a senha
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('senha');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Troca o ícone
            this.classList.toggle('bi-eye-fill');
            this.classList.toggle('bi-eye-slash-fill');
        });
    }
});