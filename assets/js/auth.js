import { db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { showToast } from './ui.js';
import { validarCPF } from './validators.js';

// Função para hash de senha (simples para demonstração)
async function hashSenha(senha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função de login
export async function login(cpf, senha) {
  try {
    // Validar CPF
    if (!validarCPF(cpf)) {
      throw new Error('CPF inválido');
    }

    // Limpar CPF para buscar no Firestore
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Buscar usuário no Firestore
    const userDoc = await getDoc(doc(db, 'users', cpfLimpo));
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userDoc.data();
    
    // Verificar senha
    const senhaHash = await hashSenha(senha);
    if (userData.senhaHash !== senhaHash) {
      throw new Error('Senha incorreta');
    }

    // Salvar sessão
    const userSession = {
      cpf: cpfLimpo,
      nome: userData.nome,
      municipio: userData.municipio,
      cargo: userData.cargo,
      registro: userData.registro,
      role: userData.role,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('userSession', JSON.stringify(userSession));
    
    showToast('Login realizado com sucesso!', 'success');
    return userSession;

  } catch (error) {
    console.error('Erro no login:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Função de logout
export function logout() {
  localStorage.removeItem('userSession');
  showToast('Logout realizado com sucesso', 'info');
  window.location.href = 'login.html';
}

// Função para obter usuário logado
export function getCurrentUser() {
  const session = localStorage.getItem('userSession');
  return session ? JSON.parse(session) : null;
}

// Função para verificar se usuário está logado
export function onUserReady(callback) {
  const user = getCurrentUser();
  if (user) {
    callback(user);
  } else {
    callback(null);
  }
}

// Função para proteger rotas
export function requireAuth(redirectTo = 'login.html') {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return false;
  }
  return user;
}

// Verificar se usuário tem permissão
export function hasPermission(user, requiredRoles) {
  if (!user || !user.role) return false;
  return requiredRoles.includes(user.role);
}