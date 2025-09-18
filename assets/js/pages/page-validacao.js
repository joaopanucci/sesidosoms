import { requireAuth, hasPermission } from '../auth.js';
import { listarAvaliacoes, aprovarAvaliacao, rejeitarAvaliacao, obterEstatisticas } from '../dal.js';
import { showToast, showModal, hideModal } from '../ui.js';
import { loadHeader } from '../components/header.js';

let avaliacoes = [];
let filtroAtivo = 'todas';

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  const user = requireAuth();
  if (!user) return;
  
  // Carregar header dinâmico
  loadHeader();
  
  initValidacao();
});

async function initValidacao() {
  try {
    // Carregar estatísticas
    await carregarEstatisticas();
    
    // Carregar avaliações
    await carregarAvaliacoes();
    
    // Configurar filtros
    configurarFiltros();
    
    // Configurar ações
    configurarAcoes();
    
  } catch (error) {
    console.error('Erro ao inicializar validação:', error);
    showToast('Erro ao carregar dados', 'error');
  }
}

async function carregarEstatisticas() {
  try {
    const stats = await obterEstatisticas();
    
    const elementos = {
      totalAvaliacoes: document.getElementById('totalAvaliacoes'),
      avaliacoesPendentes: document.getElementById('avaliacoesPendentes'),
      avaliacoesAprovadas: document.getElementById('avaliacoesAprovadas'),
      avaliacoesRejeitadas: document.getElementById('avaliacoesRejeitadas')
    };
    
    if (elementos.totalAvaliacoes) elementos.totalAvaliacoes.textContent = stats.total;
    if (elementos.avaliacoesPendentes) elementos.avaliacoesPendentes.textContent = stats.pendentes;
    if (elementos.avaliacoesAprovadas) elementos.avaliacoesAprovadas.textContent = stats.aprovadas;
    if (elementos.avaliacoesRejeitadas) elementos.avaliacoesRejeitadas.textContent = stats.rejeitadas;
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

async function carregarAvaliacoes(filtro = {}) {
  try {
    avaliacoes = await listarAvaliacoes(filtro);
    renderizarAvaliacoes();
    
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    showToast('Erro ao carregar avaliações', 'error');
  }
}

function renderizarAvaliacoes() {
  const container = document.getElementById('avaliacoesContainer');
  if (!container) return;
  
  if (avaliacoes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500">Nenhuma avaliação encontrada</p>
      </div>
    `;
    return;
  }
  
  const html = avaliacoes.map(avaliacao => criarCardAvaliacao(avaliacao)).join('');
  container.innerHTML = html;
  
  // Adicionar event listeners
  container.querySelectorAll('.btn-aprovar').forEach(btn => {
    btn.addEventListener('click', () => aprovar(btn.dataset.id));
  });
  
  container.querySelectorAll('.btn-rejeitar').forEach(btn => {
    btn.addEventListener('click', () => rejeitar(btn.dataset.id));
  });
  
  container.querySelectorAll('.btn-detalhes').forEach(btn => {
    btn.addEventListener('click', () => mostrarDetalhes(btn.dataset.id));
  });
}

function criarCardAvaliacao(avaliacao) {
  const user = requireAuth();
  const podeAprovar = hasPermission(user, ['coordenador', 'gerente', 'admin']);
  const statusClass = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'aprovada': 'bg-green-100 text-green-800',
    'rejeitada': 'bg-red-100 text-red-800'
  };
  
  const acoes = avaliacao.status === 'pendente' && podeAprovar ? `
    <div class="flex space-x-2">
      <button class="btn-aprovar bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600" data-id="${avaliacao.id}">
        Aprovar
      </button>
      <button class="btn-rejeitar bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" data-id="${avaliacao.id}">
        Rejeitar
      </button>
    </div>
  ` : '';
  
  return `
    <div class="bg-white p-4 rounded-lg shadow border">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-gray-800">${escapeHtml(avaliacao.pacienteNome)}</h3>
          <p class="text-sm text-gray-600">Profissional: ${escapeHtml(avaliacao.profissionalNome)}</p>
          <p class="text-sm text-gray-600">Data: ${formatarDataHora(avaliacao.criadoEm)}</p>
        </div>
        <span class="px-2 py-1 rounded text-xs font-medium ${statusClass[avaliacao.status] || 'bg-gray-100 text-gray-800'}">
          ${avaliacao.status.toUpperCase()}
        </span>
      </div>
      
      <div class="flex justify-between items-center">
        <button class="btn-detalhes text-blue-500 hover:text-blue-700 text-sm" data-id="${avaliacao.id}">
          Ver Detalhes
        </button>
        ${acoes}
      </div>
    </div>
  `;
}

function configurarFiltros() {
  const filtros = ['todas', 'pendentes', 'aprovadas', 'rejeitadas'];
  
  filtros.forEach(filtro => {
    const btn = document.getElementById(`filtro-${filtro}`);
    if (btn) {
      btn.addEventListener('click', async () => {
        filtroAtivo = filtro;
        
        // Atualizar visual dos botões
        filtros.forEach(f => {
          const button = document.getElementById(`filtro-${f}`);
          if (button) {
            button.classList.remove('bg-blue-500', 'text-white');
            button.classList.add('bg-gray-200', 'text-gray-700');
          }
        });
        
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        btn.classList.add('bg-blue-500', 'text-white');
        
        // Aplicar filtro
        const filtroParams = filtro === 'todas' ? {} : { status: filtro.slice(0, -1) };
        await carregarAvaliacoes(filtroParams);
      });
    }
  });
}

function configurarAcoes() {
  // Modal de rejeição
  const modalRejeicao = document.getElementById('modalRejeicao');
  const formRejeicao = document.getElementById('formRejeicao');
  
  if (formRejeicao) {
    formRejeicao.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const avaliacaoId = formRejeicao.dataset.avaliacaoId;
      const motivo = formRejeicao.motivo.value;
      
      if (!motivo) {
        showToast('Por favor, informe o motivo da rejeição', 'error');
        return;
      }
      
      try {
        await rejeitarAvaliacao(avaliacaoId, motivo);
        hideModal('modalRejeicao');
        await carregarAvaliacoes();
        await carregarEstatisticas();
        
      } catch (error) {
        console.error('Erro ao rejeitar:', error);
      }
    });
  }
}

async function aprovar(id) {
  if (!confirm('Tem certeza que deseja aprovar esta avaliação?')) return;
  
  try {
    await aprovarAvaliacao(id);
    await carregarAvaliacoes();
    await carregarEstatisticas();
    
  } catch (error) {
    console.error('Erro ao aprovar:', error);
  }
}

function rejeitar(id) {
  const form = document.getElementById('formRejeicao');
  if (form) {
    form.dataset.avaliacaoId = id;
    form.reset();
  }
  
  showModal('modalRejeicao');
}

function mostrarDetalhes(id) {
  const avaliacao = avaliacoes.find(a => a.id === id);
  if (!avaliacao) return;
  
  const modalContent = document.getElementById('detalhesContent');
  if (modalContent) {
    modalContent.innerHTML = criarDetalhesAvaliacao(avaliacao);
  }
  
  showModal('modalDetalhes');
}

function criarDetalhesAvaliacao(avaliacao) {
  let html = `
    <div class="mb-4">
      <h3 class="text-lg font-semibold">Detalhes da Avaliação</h3>
      <p><strong>Paciente:</strong> ${escapeHtml(avaliacao.pacienteNome)}</p>
      <p><strong>Profissional:</strong> ${escapeHtml(avaliacao.profissionalNome)}</p>
      <p><strong>Data:</strong> ${formatarDataHora(avaliacao.criadoEm)}</p>
      <p><strong>Status:</strong> ${avaliacao.status.toUpperCase()}</p>
    </div>
  `;
  
  if (avaliacao.ivcf20) {
    html += `
      <div class="mb-4">
        <h4 class="font-semibold mb-2">IVCF-20</h4>
        <div class="grid grid-cols-1 gap-2">
    `;
    
    Object.entries(avaliacao.ivcf20).forEach(([questao, resposta]) => {
      html += `<p class="text-sm"><strong>${questao}:</strong> ${escapeHtml(resposta)}</p>`;
    });
    
    html += `</div></div>`;
  }
  
  if (avaliacao.ivsf10) {
    html += `
      <div class="mb-4">
        <h4 class="font-semibold mb-2">IVSF-10</h4>
        <div class="grid grid-cols-1 gap-2">
    `;
    
    Object.entries(avaliacao.ivsf10).forEach(([questao, resposta]) => {
      html += `<p class="text-sm"><strong>${questao}:</strong> ${escapeHtml(resposta)}</p>`;
    });
    
    html += `</div></div>`;
  }
  
  if (avaliacao.observacoes) {
    html += `
      <div class="mb-4">
        <h4 class="font-semibold mb-2">Observações</h4>
        <p class="text-sm">${escapeHtml(avaliacao.observacoes)}</p>
      </div>
    `;
  }
  
  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatarDataHora(timestamp) {
  if (!timestamp) return '';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleString('pt-BR');
}