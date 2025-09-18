// page-inicio.js - Página inicial do IdosoMS
import { logout, getCurrentUser, requireAuth } from '../auth.js';
import { showNotification } from '../ui.js';

class InicioPage {
    constructor() {
        this.usuario = null;
        this.init();
    }

    async init() {
        // Verificar autenticação
        await requireAuth();
        
        // Carregar dados do usuário
        await this.carregarUsuario();
        
        // Configurar navegação
        this.configurarNavegacao();
        
        // Configurar botões
        this.configurarBotoes();
        
        // Carregar estatísticas
        await this.carregarEstatisticas();
    }

    async carregarUsuario() {
        try {
            this.usuario = await getCurrentUser();
            
            // Atualizar interface com dados do usuário
            const nomeElement = document.getElementById('nomeUsuario');
            const cargoElement = document.getElementById('cargoUsuario');
            
            if (nomeElement && this.usuario) {
                nomeElement.textContent = this.usuario.nome;
            }
            
            if (cargoElement && this.usuario) {
                const cargoFormatado = this.formatarCargo(this.usuario.cargo);
                cargoElement.textContent = `${cargoFormatado} - ${this.usuario.municipio}`;
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            showNotification('Erro ao carregar dados do usuário', 'error');
        }
    }

    formatarCargo(cargo) {
        const cargos = {
            'Agente': 'Agente Comunitário',
            'Coordenador': 'Coordenador',
            'Gerente': 'Gerente',
            'Admin': 'Administrador'
        };
        return cargos[cargo] || cargo;
    }

    configurarNavegacao() {
        // Tornar funções globais para onclick dos cards
        window.navegarPara = this.navegarPara.bind(this);
        window.mostrarConfiguracoes = this.mostrarConfiguracoes.bind(this);
        
        // Adicionar efeito visual nos cards
        document.querySelectorAll('.card-hover').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }

    configurarBotoes() {
        // Botão de sair
        const sairBtn = document.getElementById('sairBtn');
        if (sairBtn) {
            sairBtn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja sair do sistema?')) {
                    try {
                        await logout();
                        window.location.href = 'login.html';
                    } catch (error) {
                        console.error('Erro ao fazer logout:', error);
                        showNotification('Erro ao sair do sistema', 'error');
                    }
                }
            });
        }
    }

    navegarPara(pagina) {
        try {
            // Verificar se o usuário tem permissão para a página
            if (this.verificarPermissao(pagina)) {
                window.location.href = pagina;
            } else {
                showNotification('Você não tem permissão para acessar esta página', 'error');
            }
        } catch (error) {
            console.error('Erro na navegação:', error);
            showNotification('Erro ao navegar para a página', 'error');
        }
    }

    verificarPermissao(pagina) {
        if (!this.usuario) return false;
        
        const permissoes = {
            'autorizarcadastro.html': ['Admin', 'Gerente'],
            'avaliacao.html': ['Admin', 'Gerente', 'Coordenador', 'Agente'],
            'dashboard.html': ['Admin', 'Gerente', 'Coordenador'],
            'validacao.html': ['Admin', 'Gerente', 'Coordenador'],
            'cadastrarpaciente.html': ['Admin', 'Gerente', 'Coordenador', 'Agente']
        };
        
        const paginaPermissoes = permissoes[pagina];
        return !paginaPermissoes || paginaPermissoes.includes(this.usuario.cargo);
    }

    mostrarConfiguracoes() {
        showNotification('Funcionalidade de configurações em desenvolvimento', 'info');
    }

    async carregarEstatisticas() {
        try {
            // Em um sistema real, carregaria dados do Firebase
            // Por enquanto, usar dados estáticos baseados no município
            const stats = await this.obterEstatisticas();
            this.atualizarInterface(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Manter valores padrão se houver erro
        }
    }

    async obterEstatisticas() {
        // Simular dados baseados no município do usuário
        const estatisticas = {
            'Campo Grande': {
                profissionais: 1247,
                cadastrosPendentes: 89,
                pacientesCadastrados: 15432,
                taxaAprovacao: '98.5%'
            },
            'Dourados': {
                profissionais: 567,
                cadastrosPendentes: 34,
                pacientesCadastrados: 7821,
                taxaAprovacao: '97.2%'
            },
            'Três Lagoas': {
                profissionais: 342,
                cadastrosPendentes: 18,
                pacientesCadastrados: 4567,
                taxaAprovacao: '96.8%'
            }
        };
        
        const municipio = this.usuario?.municipio || 'Campo Grande';
        return estatisticas[municipio] || estatisticas['Campo Grande'];
    }

    atualizarInterface(stats) {
        // Atualizar números das estatísticas se os elementos existirem
        const elementos = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-4 .text-center');
        
        if (elementos.length >= 4) {
            elementos[0].querySelector('.text-3xl').textContent = stats.profissionais.toLocaleString();
            elementos[1].querySelector('.text-3xl').textContent = stats.cadastrosPendentes;
            elementos[2].querySelector('.text-3xl').textContent = stats.pacientesCadastrados.toLocaleString();
            elementos[3].querySelector('.text-3xl').textContent = stats.taxaAprovacao;
        }
    }
}

// Inicializar página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new InicioPage();
});