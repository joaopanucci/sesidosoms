import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getCurrentUser } from './auth.js';
import { showToast } from './ui.js';

// CRUD de Pacientes
export async function cadastrarPaciente(dados) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const pacienteData = {
      ...dados,
      municipio: user.municipio,
      criadoPor: user.cpf,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'pacientes'), pacienteData);
    showToast('Paciente cadastrado com sucesso!', 'success');
    return docRef.id;

  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    showToast('Erro ao cadastrar paciente: ' + error.message, 'error');
    throw error;
  }
}

export async function listarPacientes(filtros = {}) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    let q = query(
      collection(db, 'pacientes'),
      where('municipio', '==', user.municipio),
      orderBy('criadoEm', 'desc')
    );

    if (filtros.nome) {
      q = query(q, where('nome', '>=', filtros.nome), where('nome', '<=', filtros.nome + '\uf8ff'));
    }

    const querySnapshot = await getDocs(q);
    const pacientes = [];
    querySnapshot.forEach((doc) => {
      pacientes.push({ id: doc.id, ...doc.data() });
    });

    return pacientes;

  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    showToast('Erro ao carregar pacientes: ' + error.message, 'error');
    throw error;
  }
}

export async function buscarPacientePorCPF(cpf) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const cpfLimpo = cpf.replace(/\D/g, '');
    
    const q = query(
      collection(db, 'pacientes'),
      where('cpf', '==', cpfLimpo),
      where('municipio', '==', user.municipio)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };

  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    throw error;
  }
}

// CRUD de Avaliações
export async function criarAvaliacao(dados) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const avaliacaoData = {
      ...dados,
      municipio: user.municipio,
      profissional: user.cpf,
      profissionalNome: user.nome,
      status: 'pendente',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'avaliacoes'), avaliacaoData);
    showToast('Avaliação criada com sucesso!', 'success');
    return docRef.id;

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    showToast('Erro ao criar avaliação: ' + error.message, 'error');
    throw error;
  }
}

export async function listarAvaliacoes(filtros = {}) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    let q = query(
      collection(db, 'avaliacoes'),
      where('municipio', '==', user.municipio),
      orderBy('criadoEm', 'desc')
    );

    if (filtros.status) {
      q = query(q, where('status', '==', filtros.status));
    }

    if (filtros.pacienteId) {
      q = query(q, where('pacienteId', '==', filtros.pacienteId));
    }

    const querySnapshot = await getDocs(q);
    const avaliacoes = [];
    querySnapshot.forEach((doc) => {
      avaliacoes.push({ id: doc.id, ...doc.data() });
    });

    return avaliacoes;

  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    showToast('Erro ao carregar avaliações: ' + error.message, 'error');
    throw error;
  }
}

export async function aprovarAvaliacao(id, observacoes = '') {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    if (!['coordenador', 'gerente', 'admin'].includes(user.role)) {
      throw new Error('Sem permissão para aprovar avaliações');
    }

    await updateDoc(doc(db, 'avaliacoes', id), {
      status: 'aprovada',
      aprovadoPor: user.cpf,
      aprovadoPorNome: user.nome,
      aprovadoEm: Timestamp.now(),
      observacoes: observacoes,
      atualizadoEm: Timestamp.now()
    });

    showToast('Avaliação aprovada com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao aprovar avaliação:', error);
    showToast('Erro ao aprovar avaliação: ' + error.message, 'error');
    throw error;
  }
}

export async function rejeitarAvaliacao(id, motivo) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    if (!['coordenador', 'gerente', 'admin'].includes(user.role)) {
      throw new Error('Sem permissão para rejeitar avaliações');
    }

    await updateDoc(doc(db, 'avaliacoes', id), {
      status: 'rejeitada',
      rejeitadoPor: user.cpf,
      rejeitadoPorNome: user.nome,
      rejeitadoEm: Timestamp.now(),
      motivoRejeicao: motivo,
      atualizadoEm: Timestamp.now()
    });

    showToast('Avaliação rejeitada', 'warning');

  } catch (error) {
    console.error('Erro ao rejeitar avaliação:', error);
    showToast('Erro ao rejeitar avaliação: ' + error.message, 'error');
    throw error;
  }
}

// Função para obter estatísticas
export async function obterEstatisticas() {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const avaliacoes = await listarAvaliacoes();
    
    const stats = {
      total: avaliacoes.length,
      pendentes: avaliacoes.filter(a => a.status === 'pendente').length,
      aprovadas: avaliacoes.filter(a => a.status === 'aprovada').length,
      rejeitadas: avaliacoes.filter(a => a.status === 'rejeitada').length
    };

    return stats;

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
}