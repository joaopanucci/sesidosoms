import { login, getCurrentUser } from '../auth.js';
import { formatarCPF } from '../validators.js';
import { showToast } from '../ui.js';

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = 'inicio.html';
    return;
  }
  
  initLogin();
});

function initLogin() {
  const form = document.getElementById('loginForm');
  const cpfInput = document.getElementById('cpf');
  const senhaInput = document.getElementById('senha');
  const submitBtn = document.getElementById('submitBtn');
  
  // Aplicar máscara de CPF
  if (cpfInput) {
    cpfInput.addEventListener('input', function() {
      this.value = formatarCPF(this.value);
    });
  }
  
  // Handle form submission
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const cpf = cpfInput.value;
      const senha = senhaInput.value;
      
      // Validações básicas
      if (!cpf || !senha) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
      }
      
      // Mostrar loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Entrando...';
      }
      
      try {
        await login(cpf, senha);
        
        // Redirecionar para página inicial
        setTimeout(() => {
          window.location.href = 'inicio.html';
        }, 1000);
        
      } catch (error) {
        console.error('Erro no login:', error);
      } finally {
        // Restaurar botão
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Entrar';
        }
      }
    });
  }
}