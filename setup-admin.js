// setup-admin.js - Script para criar usuário administrativo e dados iniciais
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, doc, setDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDZNDV_eM5dhRYGu-euVqymZN6Q0br2DBA",
  authDomain: "sesidosoms.firebaseapp.com",
  projectId: "sesidosoms",
  storageBucket: "sesidosoms.firebasestorage.app",
  messagingSenderId: "932828334430",
  appId: "1:932828334430:web:02544c8138af68719ee7cf",
  measurementId: "G-H1MNREBYM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para hash SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Criar usuário master
async function createMasterUser() {
  try {
    const hashedPassword = await hashPassword('panuccises');
    
    const masterUser = {
      nome: 'Administrador do Sistema',
      cpf: '04158082196',
      senha: hashedPassword,
      cargo: 'Admin',
      municipio: 'Campo Grande',
      ativo: true,
      criadoEm: new Date(),
      criadoPor: 'sistema',
      email: 'admin@sesidosoms.ms.gov.br'
    };

    // Usar CPF como ID do documento (sem pontos e traços)
    const userId = '04158082196';
    await setDoc(doc(db, 'users', userId), masterUser);
    
    console.log('✅ Usuário master criado com sucesso!');
    console.log('📧 CPF: 04158082196');
    console.log('🔑 Senha: panuccises');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário master:', error);
  }
}

// Criar municípios do MS
async function createMunicipalities() {
  const municipiosMS = [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Maracaju',
    'São Gabriel do Oeste', 'Coxim', 'Amambai', 'Paranaíba', 'Chapadão do Sul',
    'Bonito', 'Miranda', 'Caarapó', 'Jardim', 'Anastácio',
    'Bela Vista', 'Ribas do Rio Pardo', 'Terenos', 'Aparecida do Taboado',
    'Bataguassu', 'Ivinhema', 'Cassilândia', 'Nova Alvorada do Sul', 'Rio Brilhante',
    'Sonora', 'Mundo Novo', 'Costa Rica', 'Inocência', 'Eldorado',
    'Brasilândia', 'Água Clara', 'Glória de Dourados', 'Itaquiraí', 'Dois Irmãos do Buriti',
    'Rochedo', 'Bandeirantes', 'Batayporã', 'Fátima do Sul', 'Vicentina',
    'Juti', 'Bodoquena', 'Camapuã', 'Pedro Gomes', 'Rio Verde de Mato Grosso',
    'Selvíria', 'Angélica', 'Coronel Sapucaia', 'Jateí', 'Laguna Carapã',
    'Tacuru', 'Iguatemi', 'Paranhos', 'Sete Quedas', 'Antônio João',
    'Aral Moreira', 'Douradina', 'Rio Negro', 'Japorã', 'Caracol',
    'Deodápolis', 'Itaporã', 'Santa Rita do Pardo', 'Nioaque', 'Guia Lopes da Laguna',
    'Taquarussu', 'Jaraguari', 'Alcinópolis', 'Figueirão', 'São José do Rio Claro',
    'Bonito', 'Porto Murtinho', 'Ladário', 'Corguinho', 'Ribas do Rio Pardo'
  ];

  try {
    for (const municipio of municipiosMS) {
      const municipioData = {
        nome: municipio,
        estado: 'MS',
        regiao: 'Centro-Oeste',
        ativo: true,
        criadoEm: new Date()
      };

      await addDoc(collection(db, 'municipalities'), municipioData);
      console.log(`✅ Município ${municipio} adicionado`);
    }
    
    console.log('✅ Todos os municípios do MS foram adicionados!');
    
  } catch (error) {
    console.error('❌ Erro ao criar municípios:', error);
  }
}

// Criar usuários de exemplo
async function createSampleUsers() {
  const sampleUsers = [
    {
      nome: 'Maria Silva Santos',
      cpf: '12345678901',
      senha: await hashPassword('senha123'),
      cargo: 'Gerente',
      municipio: 'Campo Grande',
      ativo: true,
      criadoEm: new Date(),
      criadoPor: '04158082196',
      email: 'maria.santos@sesidosoms.ms.gov.br'
    },
    {
      nome: 'João Pereira Lima',
      cpf: '98765432109',
      senha: await hashPassword('senha123'),
      cargo: 'Coordenador',
      municipio: 'Dourados',
      ativo: true,
      criadoEm: new Date(),
      criadoPor: '04158082196',
      email: 'joao.lima@sesidosoms.ms.gov.br'
    },
    {
      nome: 'Ana Carolina Souza',
      cpf: '11122233344',
      senha: await hashPassword('senha123'),
      cargo: 'Agente',
      municipio: 'Três Lagoas',
      ativo: true,
      criadoEm: new Date(),
      criadoPor: '04158082196',
      email: 'ana.souza@sesidosoms.ms.gov.br'
    }
  ];

  try {
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.cpf), user);
      console.log(`✅ Usuário ${user.nome} (${user.cargo}) criado em ${user.municipio}`);
    }
    
    console.log('✅ Usuários de exemplo criados!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários de exemplo:', error);
  }
}

// Função principal
async function setupSystem() {
  console.log('🚀 Iniciando configuração do sistema IdosoMS...');
  
  try {
    await createMasterUser();
    await createMunicipalities();
    await createSampleUsers();
    
    console.log('\n✅ CONFIGURAÇÃO COMPLETA!');
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('👤 ADMIN: CPF 04158082196 / Senha: panuccises');
    console.log('👤 GERENTE: CPF 12345678901 / Senha: senha123');
    console.log('👤 COORDENADOR: CPF 98765432109 / Senha: senha123');
    console.log('👤 AGENTE: CPF 11122233344 / Senha: senha123');
    console.log('\n🌐 Acesse: login.html');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  }
}

// Exportar função para uso externo
window.setupSystem = setupSystem;

// Executar automaticamente quando carregado
if (typeof window !== 'undefined') {
  console.log('📁 Script de setup carregado. Execute setupSystem() no console.');
}