import { requireAuth, hasPermission } from '../auth.js';
import { criarAvaliacao, buscarPacientePorCPF } from '../dal.js';
import { formatarCPF, validarCPF } from '../validators.js';
import { showToast } from '../ui.js';
import { loadHeader } from '../components/header.js';

let pacienteEncontrado = null;

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação e permissões
  const user = requireAuth();
  if (!user) return;
  
  // Verificar se usuário tem permissão para criar avaliações
  if (!hasPermission(user, ['agente', 'coordenador', 'gerente', 'admin'])) {
    showToast('Você não tem permissão para criar avaliações', 'error');
    window.location.href = 'inicio.html';
    return;
  }
  
  // Carregar header dinâmico
  loadHeader();
  
  initAvaliacaoForm();
});

function initAvaliacaoForm() {
  const cpfInput = document.getElementById('cpfPaciente');
  const buscarBtn = document.getElementById('buscarPaciente');
  const avaliacaoForm = document.getElementById('avaliacaoForm');
  
  // Aplicar máscara de CPF
  if (cpfInput) {
    cpfInput.addEventListener('input', function() {
      this.value = formatarCPF(this.value);
    });
  }
  
  // Buscar paciente por CPF
  if (buscarBtn) {
    buscarBtn.addEventListener('click', async function() {
      const cpf = cpfInput.value;
      
      if (!validarCPF(cpf)) {
        showToast('CPF inválido', 'error');
        return;
      }
      
      try {
        buscarBtn.disabled = true;
        buscarBtn.innerHTML = '<span class="spinner"></span> Buscando...';
        
        const paciente = await buscarPacientePorCPF(cpf);
        
        if (paciente) {
          pacienteEncontrado = paciente;
          mostrarDadosPaciente(paciente);
          mostrarFormularioAvaliacao();
        } else {
          showToast('Paciente não encontrado', 'warning');
          ocultarFormularioAvaliacao();
        }
        
      } catch (error) {
        console.error('Erro ao buscar paciente:', error);
        showToast('Erro ao buscar paciente', 'error');
      } finally {
        buscarBtn.disabled = false;
        buscarBtn.innerHTML = 'Buscar';
      }
    });
  }
  
  // Handle avaliação form submission
  if (avaliacaoForm) {
    avaliacaoForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!pacienteEncontrado) {
        showToast('Primeiro busque um paciente', 'error');
        return;
      }
      
      const dadosAvaliacao = coletarDadosAvaliacao();
      
      const submitBtn = avaliacaoForm.querySelector('button[type="submit"]');
      
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Salvando...';
        }
        
        await criarAvaliacao(dadosAvaliacao);
        
        // Resetar formulário
        avaliacaoForm.reset();
        ocultarFormularioAvaliacao();
        pacienteEncontrado = null;
        cpfInput.value = '';
        
      } catch (error) {
        console.error('Erro ao criar avaliação:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Salvar Avaliação';
        }
      }
    });
  }
}

function mostrarDadosPaciente(paciente) {
  const container = document.getElementById('dadosPaciente');
  if (container) {
    container.innerHTML = `
      <div class="bg-blue-50 p-4 rounded-lg">
        <h3 class="font-semibold text-gray-800">Dados do Paciente</h3>
        <p><strong>Nome:</strong> ${escapeHtml(paciente.nome)}</p>
        <p><strong>CPF:</strong> ${formatarCPF(paciente.cpf)}</p>
        <p><strong>Data de Nascimento:</strong> ${formatarData(paciente.dataNascimento)}</p>
      </div>
    `;
    container.classList.remove('hidden');
  }
}

function mostrarFormularioAvaliacao() {
  const container = document.getElementById('formularioContainer');
  if (container) {
    container.classList.remove('hidden');
  }
}

function ocultarFormularioAvaliacao() {
  const container = document.getElementById('formularioContainer');
  const dadosContainer = document.getElementById('dadosPaciente');
  
  if (container) container.classList.add('hidden');
  if (dadosContainer) dadosContainer.classList.add('hidden');
}

function coletarDadosAvaliacao() {
  const form = document.getElementById('avaliacaoForm');
  const formData = new FormData(form);
  
  // Coletar respostas IVCF-20
  const ivcf20 = {};
  for (let i = 1; i <= 20; i++) {
    ivcf20[`questao_${i}`] = formData.get(`ivcf_${i}`) || '';
  }
  
  // Coletar respostas IVSF-10
  const ivsf10 = {};
  for (let i = 1; i <= 10; i++) {
    ivsf10[`questao_${i}`] = formData.get(`ivsf_${i}`) || '';
  }
  
  return {
    pacienteId: pacienteEncontrado.id,
    pacienteNome: pacienteEncontrado.nome,
    pacienteCpf: pacienteEncontrado.cpf,
    ivcf20: ivcf20,
    ivsf10: ivsf10,
    observacoes: formData.get('observacoes') || '',
    dataAvaliacao: new Date().toISOString()
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatarData(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}