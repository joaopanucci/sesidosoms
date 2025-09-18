import { getCurrentUser, logout } from '../auth.js';

export function loadHeader() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Buscar elementos do header
  const nomeUsuario = document.getElementById('nomeUsuario');
  const municipioUsuario = document.getElementById('municipioUsuario');
  const cargoUsuario = document.getElementById('cargoUsuario');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Preencher dados do usuário
  if (nomeUsuario) {
    nomeUsuario.textContent = user.nome;
  }
  
  if (municipioUsuario) {
    municipioUsuario.textContent = user.municipio;
  }
  
  if (cargoUsuario) {
    cargoUsuario.textContent = user.cargo;
  }
  
  // Configurar botão de logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  // Destacar página ativa no menu
  destacarPaginaAtiva();
}

function destacarPaginaAtiva() {
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.nav-link');
  
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active', 'bg-blue-700', 'text-white');
    } else {
      link.classList.remove('active', 'bg-blue-700', 'text-white');
    }
  });
}

// Carregar header dinamicamente se existir um container
export async function loadHeaderHtml() {
  const headerContainer = document.getElementById('headerContainer');
  if (!headerContainer) return;
  
  try {
    const response = await fetch('header.html');
    if (response.ok) {
      const headerHtml = await response.text();
      headerContainer.innerHTML = headerHtml;
      
      // Após carregar o HTML, configurar os dados
      loadHeader();
    }
  } catch (error) {
    console.error('Erro ao carregar header:', error);
  }
}