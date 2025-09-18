// Funções de UI amigáveis (toasts, modals)

// Função para mostrar toast
export function showToast(message, type = 'info', duration = 4000) {
  // Remover toasts existentes
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Criar elemento toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="flex justify-between items-center">
      <span>${escapeHtml(message)}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
        ×
      </button>
    </div>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(toast);
  
  // Mostrar toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Remover toast automaticamente
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, duration);
}

// Função para mostrar modal
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // Fechar modal ao clicar fora
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal(modalId);
    }
  });
  
  // Fechar modal com ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideModal(modalId);
    }
  });
}

// Função para esconder modal
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('show');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

// Função para confirmar ação (substitui confirm nativo)
export function showConfirm(message, onConfirm, onCancel = null) {
  const confirmModal = createConfirmModal(message, onConfirm, onCancel);
  document.body.appendChild(confirmModal);
  
  setTimeout(() => {
    confirmModal.classList.add('show');
  }, 10);
}

function createConfirmModal(message, onConfirm, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content max-w-md">
      <h3 class="text-lg font-semibold mb-4">Confirmação</h3>
      <p class="mb-6">${escapeHtml(message)}</p>
      <div class="flex justify-end space-x-3">
        <button class="btn-cancel bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
          Cancelar
        </button>
        <button class="btn-confirm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Confirmar
        </button>
      </div>
    </div>
  `;
  
  // Event listeners
  const btnCancel = modal.querySelector('.btn-cancel');
  const btnConfirm = modal.querySelector('.btn-confirm');
  
  btnCancel.addEventListener('click', () => {
    closeConfirmModal(modal);
    if (onCancel) onCancel();
  });
  
  btnConfirm.addEventListener('click', () => {
    closeConfirmModal(modal);
    onConfirm();
  });
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeConfirmModal(modal);
      if (onCancel) onCancel();
    }
  });
  
  return modal;
}

function closeConfirmModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 300);
}

// Função para mostrar loading
export function showLoading(message = 'Carregando...') {
  const existingLoading = document.getElementById('globalLoading');
  if (existingLoading) return;
  
  const loading = document.createElement('div');
  loading.id = 'globalLoading';
  loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loading.innerHTML = `
    <div class="bg-white p-6 rounded-lg flex items-center space-x-3">
      <div class="spinner"></div>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  
  document.body.appendChild(loading);
}

// Função para esconder loading
export function hideLoading() {
  const loading = document.getElementById('globalLoading');
  if (loading) {
    loading.remove();
  }
}

// Função para sanitizar HTML (prevenir XSS)
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Função para criar elementos DOM de forma segura
export function createElement(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

// Função para debounce (otimização de performance)
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Função para formatar valores monetários
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Função para formatar datas
export function formatarData(data, formato = 'dd/MM/yyyy') {
  if (!data) return '';
  
  const date = new Date(data);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('pt-BR');
}

// Função para formatar telefone
export function formatarTelefone(valor) {
  if (!valor) return '';
  
  const numeros = valor.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return valor;
}