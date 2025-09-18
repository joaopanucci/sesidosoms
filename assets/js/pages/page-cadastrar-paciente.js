import { requireAuth, hasPermission } from '../auth.js';
import { cadastrarPaciente } from '../dal.js';
import { formatarCPF, validarCPF } from '../validators.js';
import { showToast } from '../ui.js';
import { loadHeader } from '../components/header.js';

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação e permissões
  const user = requireAuth();
  if (!user) return;
  
  // Verificar se usuário tem permissão para cadastrar pacientes
  if (!hasPermission(user, ['agente', 'coordenador', 'gerente', 'admin'])) {
    showToast('Você não tem permissão para cadastrar pacientes', 'error');
    window.location.href = 'inicio.html';
    return;
  }
  
  // Carregar header dinâmico
  loadHeader();
  
  initCadastroForm();
});

function initCadastroForm() {
  const form = document.getElementById('cadastroForm');
  const cpfInput = document.getElementById('cpfPaciente');
  
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
      
      const formData = new FormData(form);
      const dadosPaciente = {
        nome: formData.get('nome'),
        cpf: formData.get('cpfPaciente').replace(/\D/g, ''),
        dataNascimento: formData.get('dataNascimento'),
        sexo: formData.get('sexo'),
        telefone: formData.get('telefone'),
        endereco: {
          rua: formData.get('endereco'),
          cep: formData.get('cep'),
          bairro: formData.get('bairro')
        }
      };
      
      // Validações
      if (!dadosPaciente.nome || !dadosPaciente.cpf || !dadosPaciente.dataNascimento) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
      }
      
      if (!validarCPF(dadosPaciente.cpf)) {
        showToast('CPF inválido', 'error');
        return;
      }
      
      const submitBtn = form.querySelector('button[type="submit"]');
      
      try {
        // Mostrar loading
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Cadastrando...';
        }
        
        await cadastrarPaciente(dadosPaciente);
        
        // Limpar formulário
        form.reset();
        
        // Mostrar sucesso
        showToast('Paciente cadastrado com sucesso!', 'success');
        
      } catch (error) {
        console.error('Erro ao cadastrar paciente:', error);
      } finally {
        // Restaurar botão
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Cadastrar Paciente';
        }
      }
    });
  }
}