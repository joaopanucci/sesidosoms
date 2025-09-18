// page-dashboard.js - Dashboard com estatísticas de avaliações
import { requireAuth, getCurrentUser } from '../auth.js';
import { listarAvaliacoes } from '../dal.js';
import { showNotification } from '../ui.js';

class DashboardPage {
    constructor() {
        this.usuario = null;
        this.avaliacoes = [];
        this.avaliacoesFiltradas = [];
        this.graficoTipos = null;
        this.init();
    }

    async init() {
        // Verificar autenticação
        await requireAuth();
        
        // Carregar dados do usuário
        await this.carregarUsuario();
        
        // Configurar interface
        this.configurarInterface();
        
        // Carregar dados
        await this.carregarAvaliacoes();
        
        // Tornar funções globais para onclick
        window.voltarInicio = this.voltarInicio.bind(this);
        window.limparFiltros = this.limparFiltros.bind(this);
        window.exportarDados = this.exportarDados.bind(this);
    }

    async carregarUsuario() {
        try {
            this.usuario = await getCurrentUser();
            
            // Atualizar interface
            const nomeElement = document.getElementById('nomeUsuario');
            const municipioElement = document.getElementById('municipioUsuario');
            const filtroMunicipio = document.getElementById('municipioFiltro');
            
            if (nomeElement && this.usuario) {
                nomeElement.textContent = this.usuario.nome;
            }
            
            if (municipioElement && this.usuario) {
                municipioElement.textContent = `${this.usuario.municipio} - MS`;
            }
            
            if (filtroMunicipio && this.usuario) {
                filtroMunicipio.textContent = `${this.usuario.municipio} - MS`;
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        }
    }

    configurarInterface() {
        // Configurar filtros
        const filtros = ['filtroTipoAvaliacao', 'filtroNota', 'filtroPeriodo'];
        filtros.forEach(filtroId => {
            const elemento = document.getElementById(filtroId);
            if (elemento) {
                elemento.addEventListener('change', () => this.aplicarFiltros());
            }
        });

        // Configurar botões
        const voltarBtn = document.getElementById('voltarBtn');
        if (voltarBtn) {
            voltarBtn.addEventListener('click', () => this.voltarInicio());
        }

        const limparBtn = document.getElementById('limparFiltrosBtn');
        if (limparBtn) {
            limparBtn.addEventListener('click', () => this.limparFiltros());
        }

        const exportarBtn = document.getElementById('exportarBtn');
        if (exportarBtn) {
            exportarBtn.addEventListener('click', () => this.exportarDados());
        }

        // Atualização automática
        setInterval(() => {
            this.carregarAvaliacoes();
        }, 300000); // 5 minutos
    }

    async carregarAvaliacoes() {
        try {
            // Em um sistema real, buscaria do Firebase
            const todasAvaliacoes = await listarAvaliacoes();
            
            // Filtrar por município do usuário
            this.avaliacoes = todasAvaliacoes.filter(av => 
                av.municipio === this.usuario?.municipio
            );
            
            this.avaliacoesFiltradas = [...this.avaliacoes];
            this.atualizarDashboard();
            this.atualizarUltimaAtualizacao();
            
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            // Usar dados fictícios para demonstração
            this.gerarDadosFicticios();
        }
    }

    gerarDadosFicticios() {
        // Gerar dados fictícios para demonstração
        const tipos = ['unidade-saude', 'atendimento', 'medicamento', 'servico'];
        const municipio = this.usuario?.municipio || 'Campo Grande';
        
        this.avaliacoes = Array.from({length: 50}, (_, i) => ({
            id: `av_${i + 1}`,
            tipo: tipos[Math.floor(Math.random() * tipos.length)],
            titulo: `Avaliação ${i + 1}`,
            nota: Math.floor(Math.random() * 5) + 1,
            comentario: `Comentário da avaliação ${i + 1}`,
            municipio,
            dataValidacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            validadoPor: this.usuario?.nome || 'Sistema',
            status: 'aprovada'
        }));
        
        this.avaliacoesFiltradas = [...this.avaliacoes];
        this.atualizarDashboard();
    }

    atualizarDashboard() {
        this.atualizarMetricas();
        this.atualizarGraficos();
        this.renderizarAvaliacoes();
    }

    atualizarMetricas() {
        const total = this.avaliacoesFiltradas.length;
        const notaMedia = total > 0 ? 
            (this.avaliacoesFiltradas.reduce((sum, av) => sum + av.nota, 0) / total).toFixed(1) : 0;
        const positivas = this.avaliacoesFiltradas.filter(av => av.nota >= 4).length;
        const melhorias = this.avaliacoesFiltradas.filter(av => av.nota <= 3).length;

        this.atualizarElemento('totalAvaliacoes', total);
        this.atualizarElemento('notaMedia', notaMedia);
        this.atualizarElemento('avaliacoesPositivas', positivas);
        this.atualizarElemento('pontosMelhoria', melhorias);

        // Percentuais
        const percPositivas = total > 0 ? Math.round((positivas / total) * 100) + '%' : '0%';
        const percMelhorias = total > 0 ? Math.round((melhorias / total) * 100) + '%' : '0%';
        
        this.atualizarElemento('percentualPositivas', percPositivas);
        this.atualizarElemento('percentualMelhoria', percMelhorias);

        // Estrelas
        const estrelas = '⭐'.repeat(Math.round(notaMedia)) || '☆☆☆☆☆';
        this.atualizarElemento('estrelas', estrelas);
    }

    atualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    atualizarGraficos() {
        this.atualizarGraficoTipos();
    }

    atualizarGraficoTipos() {
        const canvas = document.getElementById('graficoTipos');
        if (!canvas) return;

        // Destruir gráfico anterior se for Chart.js
        if (this.graficoTipos && typeof this.graficoTipos.destroy === 'function') {
            this.graficoTipos.destroy();
        }

        // Verificar se Chart.js está disponível
        if (typeof Chart !== 'undefined') {
            this.criarGraficoChartJS(canvas);
        } else {
            this.criarGraficoCanvas(canvas);
        }
    }

    criarGraficoChartJS(canvas) {
        const tipos = ['unidade-saude', 'atendimento', 'medicamento', 'servico'];
        const tiposLabels = ['Unidade de Saúde', 'Atendimento', 'Medicamento', 'Serviço'];
        const dadosTipos = tipos.map(tipo => 
            this.avaliacoesFiltradas.filter(av => av.tipo === tipo).length
        );

        const ctx = canvas.getContext('2d');
        this.graficoTipos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: tiposLabels,
                datasets: [{
                    data: dadosTipos,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    criarGraficoCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 200;

        const tipos = ['unidade-saude', 'atendimento', 'medicamento', 'servico'];
        const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        const dados = tipos.map((tipo, i) => ({
            label: tipo.replace('-', ' ').toUpperCase(),
            valor: this.avaliacoesFiltradas.filter(av => av.tipo === tipo).length,
            cor: cores[i]
        }));

        ctx.clearRect(0, 0, width, height);

        // Gráfico de barras simples
        const barWidth = width / dados.length / 1.5;
        const maxValue = Math.max(...dados.map(d => d.valor)) || 1;

        dados.forEach((item, index) => {
            const barHeight = (item.valor / maxValue) * (height - 60);
            const x = (width / dados.length) * index + (width / dados.length - barWidth) / 2;
            const y = height - barHeight - 40;

            // Barra
            ctx.fillStyle = item.cor;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Valor
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.valor.toString(), x + barWidth / 2, y - 5);

            // Label
            ctx.fillText(item.label, x + barWidth / 2, height - 10);
        });
    }

    renderizarAvaliacoes() {
        const container = document.getElementById('listaAvaliacoes');
        const semAvaliacoes = document.getElementById('semAvaliacoes');

        if (!container) return;

        if (this.avaliacoesFiltradas.length === 0) {
            container.innerHTML = '';
            if (semAvaliacoes) semAvaliacoes.classList.remove('hidden');
            return;
        }

        if (semAvaliacoes) semAvaliacoes.classList.add('hidden');

        const avaliacoesRecentes = this.avaliacoesFiltradas
            .sort((a, b) => new Date(b.dataValidacao) - new Date(a.dataValidacao))
            .slice(0, 10);

        const html = avaliacoesRecentes.map(avaliacao => `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            ${this.getTipoTexto(avaliacao.tipo)}
                        </span>
                        <div class="text-yellow-500">
                            ${'⭐'.repeat(avaliacao.nota)}${'☆'.repeat(5 - avaliacao.nota)}
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">
                        ${new Date(avaliacao.dataValidacao).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                
                <h4 class="font-medium text-gray-800 mb-2">${this.escapeHtml(avaliacao.titulo)}</h4>
                <p class="text-gray-600 text-sm mb-2">${this.escapeHtml(avaliacao.comentario)}</p>
                
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>Validado por: ${this.escapeHtml(avaliacao.validadoPor)}</span>
                    <span>Município: ${this.escapeHtml(avaliacao.municipio)}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    getTipoTexto(tipo) {
        const tipos = {
            'unidade-saude': 'Unidade de Saúde',
            'atendimento': 'Atendimento',
            'medicamento': 'Medicamento',
            'servico': 'Serviço'
        };
        return tipos[tipo] || tipo;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    aplicarFiltros() {
        const tipoFiltro = document.getElementById('filtroTipoAvaliacao')?.value;
        const notaFiltro = document.getElementById('filtroNota')?.value;
        const periodoFiltro = document.getElementById('filtroPeriodo')?.value;

        this.avaliacoesFiltradas = this.avaliacoes.filter(avaliacao => {
            // Filtro por tipo
            if (tipoFiltro !== 'todas' && avaliacao.tipo !== tipoFiltro) {
                return false;
            }

            // Filtro por nota
            if (notaFiltro !== 'todas' && avaliacao.nota !== parseInt(notaFiltro)) {
                return false;
            }

            // Filtro por período
            if (periodoFiltro !== 'todos') {
                const diasAtras = parseInt(periodoFiltro);
                const dataLimite = new Date();
                dataLimite.setDate(dataLimite.getDate() - diasAtras);
                const dataAvaliacao = new Date(avaliacao.dataValidacao);
                
                if (dataAvaliacao < dataLimite) {
                    return false;
                }
            }

            return true;
        });

        this.atualizarDashboard();
    }

    limparFiltros() {
        const filtros = ['filtroTipoAvaliacao', 'filtroNota', 'filtroPeriodo'];
        const valores = ['todas', 'todas', 'todos'];
        
        filtros.forEach((filtroId, index) => {
            const elemento = document.getElementById(filtroId);
            if (elemento) elemento.value = valores[index];
        });
        
        this.avaliacoesFiltradas = [...this.avaliacoes];
        this.atualizarDashboard();
    }

    exportarDados() {
        if (this.avaliacoesFiltradas.length === 0) {
            showNotification('Não há dados para exportar com os filtros atuais', 'warning');
            return;
        }

        try {
            const dados = this.avaliacoesFiltradas.map(av => ({
                'Data': new Date(av.dataValidacao).toLocaleDateString('pt-BR'),
                'Tipo': this.getTipoTexto(av.tipo),
                'Título': av.titulo,
                'Nota': av.nota,
                'Comentário': av.comentario,
                'Município': av.municipio,
                'Validado Por': av.validadoPor
            }));

            const csv = [
                Object.keys(dados[0]).join(','),
                ...dados.map(row => Object.values(row).map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `avaliacoes_${this.usuario?.municipio?.replace(' - ', '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            showNotification('Dados exportados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            showNotification('Erro ao exportar dados', 'error');
        }
    }

    atualizarUltimaAtualizacao() {
        const elemento = document.getElementById('ultimaAtualizacao');
        if (elemento) {
            const agora = new Date();
            elemento.textContent = agora.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    voltarInicio() {
        window.location.href = 'inicio.html';
    }
}

// Inicializar quando DOM carregado
document.addEventListener('DOMContentLoaded', () => {
    new DashboardPage();
});