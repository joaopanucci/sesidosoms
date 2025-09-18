// page-cadastrarpaciente.js - Página de cadastro de pacientes
import { requireAuth, getCurrentUser } from '../auth.js';
import { cadastrarPaciente, listarPacientesPorMunicipio } from '../dal.js';
import { showNotification } from '../ui.js';
import { validarCPF, aplicarMascaraCPF, aplicarMascaraTelefone, aplicarMascaraCEP } from '../validators.js';

class CadastroPacientePage {
    constructor() {
        this.usuario = null;
        this.pacientes = [];
        this.init();
    }

    async init() {
        // Verificar autenticação
        await requireAuth();
        
        // Carregar dados do usuário
        await this.carregarUsuario();
        
        // Configurar interface
        this.configurarInterface();
        
        // Carregar pacientes
        await this.carregarPacientes();
    }

    async carregarUsuario() {
        try {
            this.usuario = await getCurrentUser();
            
            // Atualizar interface
            const nomeElement = document.getElementById('nomeUsuario');
            const municipioElement = document.getElementById('municipioUsuario');
            const cargoElement = document.getElementById('cargoUsuario');
            
            if (nomeElement && this.usuario) {
                nomeElement.textContent = this.usuario.nome;
            }
            
            if (municipioElement && this.usuario) {
                municipioElement.textContent = `${this.usuario.municipio} - MS`;
            }
            
            if (cargoElement && this.usuario) {
                cargoElement.textContent = `${this.usuario.cargo} - ${this.usuario.municipio}`;
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        }
    }

    configurarInterface() {
        // Aplicar máscaras
        this.aplicarMascaras();
        
        // Configurar formulário
        const form = document.getElementById('formCadastroPaciente');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Botão voltar
        const voltarBtn = document.getElementById('voltarBtn');
        if (voltarBtn) {
            voltarBtn.addEventListener('click', () => {
                window.location.href = 'inicio.html';
            });
        }

        // Botão limpar formulário
        const limparBtn = document.getElementById('limparFormBtn');
        if (limparBtn) {
            limparBtn.addEventListener('click', () => this.limparFormulario());
        }

        // Botão ver todos
        const verTodosBtn = document.getElementById('verTodosBtn');
        if (verTodosBtn) {
            verTodosBtn.addEventListener('click', () => this.verTodosPacientes());
        }

        // Busca por CEP
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('blur', () => this.buscarCEP());
        }

        // Validação de idade ao mudar data de nascimento
        const dataNascInput = document.getElementById('dataNascimento');
        if (dataNascInput) {
            dataNascInput.addEventListener('change', () => this.validarIdade());
        }
    }

    aplicarMascaras() {
        // Máscara CPF
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                e.target.value = aplicarMascaraCPF(e.target.value);
            });
        }

        // Máscara telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                e.target.value = aplicarMascaraTelefone(e.target.value);
            });
        }

        // Máscara CEP
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('input', (e) => {
                e.target.value = aplicarMascaraCEP(e.target.value);
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const dadosPaciente = this.coletarDadosFormulario(formData);
            
            // Validar dados
            if (!this.validarDados(dadosPaciente)) {
                return;
            }
            
            // Cadastrar no Firebase
            await cadastrarPaciente(dadosPaciente);
            
            showNotification('Paciente cadastrado com sucesso!', 'success');
            this.limparFormulario();
            await this.carregarPacientes();
            
        } catch (error) {
            console.error('Erro ao cadastrar paciente:', error);
            showNotification('Erro ao cadastrar paciente. Tente novamente.', 'error');
        }
    }

    coletarDadosFormulario(formData) {
        return {
            nomeCompleto: formData.get('nomeCompleto'),
            cpf: formData.get('cpf'),
            dataNascimento: formData.get('dataNascimento'),
            sexo: formData.get('sexo'),
            telefone: formData.get('telefone'),
            email: formData.get('email') || '',
            endereco: {
                cep: formData.get('cep'),
                logradouro: formData.get('endereco'),
                numero: formData.get('numero'),
                complemento: formData.get('complemento') || '',
                bairro: formData.get('bairro'),
                cidade: formData.get('cidade'),
                estado: formData.get('estado')
            },
            observacoes: formData.get('observacoes') || '',
            municipio: this.usuario.municipio,
            cadastradoPor: this.usuario.nome,
            criadoEm: new Date()
        };
    }

    validarDados(dados) {
        // Validar campos obrigatórios
        const camposObrigatorios = [
            'nomeCompleto', 'cpf', 'dataNascimento', 'sexo', 'telefone'
        ];
        
        for (const campo of camposObrigatorios) {
            if (!dados[campo] || dados[campo].trim() === '') {
                showNotification(`Campo ${campo.replace(/([A-Z])/g, ' $1').toLowerCase()} é obrigatório`, 'warning');
                return false;
            }
        }

        // Validar endereço obrigatório
        const enderecoObrigatorio = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
        for (const campo of enderecoObrigatorio) {
            if (!dados.endereco[campo] || dados.endereco[campo].trim() === '') {
                showNotification(`Campo ${campo} do endereço é obrigatório`, 'warning');
                return false;
            }
        }

        // Validar CPF
        if (!validarCPF(dados.cpf)) {
            showNotification('CPF inválido', 'warning');
            return false;
        }

        // Validar idade (60+ anos)
        const idade = this.calcularIdade(dados.dataNascimento);
        if (idade < 60) {
            showNotification('Este sistema é destinado a pacientes idosos (60+ anos)', 'warning');
            return false;
        }

        return true;
    }

    calcularIdade(dataNascimento) {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    }

    validarIdade() {
        const dataNascInput = document.getElementById('dataNascimento');
        if (dataNascInput && dataNascInput.value) {
            const idade = this.calcularIdade(dataNascInput.value);
            if (idade < 60) {
                showNotification('Atenção: Este sistema é para pacientes idosos (60+ anos)', 'warning');
            }
        }
    }

    async buscarCEP() {
        const cepInput = document.getElementById('cep');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                showNotification('CEP não encontrado', 'warning');
                return;
            }

            // Preencher campos automaticamente
            this.preencherEndereco(data);
            
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            showNotification('Erro ao buscar CEP. Tente novamente.', 'error');
        }
    }

    preencherEndereco(dadosCEP) {
        const campos = {
            endereco: dadosCEP.logradouro || '',
            bairro: dadosCEP.bairro || '',
            cidade: dadosCEP.localidade || '',
            estado: dadosCEP.uf || 'MS'
        };

        Object.entries(campos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
            }
        });
    }

    async carregarPacientes() {
        try {
            if (!this.usuario) return;
            
            this.pacientes = await listarPacientesPorMunicipio(this.usuario.municipio);
            this.renderizarPacientes();
            
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            // Usar dados fictícios se houver erro
            this.pacientes = [];
            this.renderizarPacientes();
        }
    }

    renderizarPacientes() {
        const listaPacientes = document.getElementById('listaPacientes');
        const semPacientes = document.getElementById('semPacientes');

        if (!listaPacientes || !semPacientes) return;

        if (this.pacientes.length === 0) {
            listaPacientes.innerHTML = '';
            semPacientes.classList.remove('hidden');
            return;
        }

        semPacientes.classList.add('hidden');

        // Mostrar os 5 mais recentes
        const pacientesRecentes = this.pacientes
            .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
            .slice(0, 5);

        const html = pacientesRecentes.map(paciente => `
            <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition duration-200">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-800">${this.escapeHtml(paciente.nomeCompleto)}</h4>
                    <span class="text-xs text-gray-500">${this.calcularIdade(paciente.dataNascimento)} anos</span>
                </div>
                
                <div class="text-sm text-gray-600 space-y-1">
                    <div>🆔 ${this.escapeHtml(paciente.cpf)}</div>
                    <div>📞 ${this.escapeHtml(paciente.telefone)}</div>
                    <div>📍 ${this.escapeHtml(paciente.endereco?.cidade || '')} - ${this.escapeHtml(paciente.endereco?.estado || 'MS')}</div>
                </div>
                
                <div class="mt-2 flex gap-2">
                    <button class="text-blue-600 hover:text-blue-800 text-xs" onclick="this.editarPaciente('${paciente.id}')">
                        Editar
                    </button>
                    <button class="text-green-600 hover:text-green-800 text-xs" onclick="this.verDetalhes('${paciente.id}')">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');

        listaPacientes.innerHTML = html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    limparFormulario() {
        const form = document.getElementById('formCadastroPaciente');
        if (form) {
            form.reset();
        }
    }

    editarPaciente(id) {
        showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    verDetalhes(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (paciente) {
            const detalhes = `
Nome: ${paciente.nomeCompleto}
CPF: ${paciente.cpf}
Idade: ${this.calcularIdade(paciente.dataNascimento)} anos
Telefone: ${paciente.telefone}
Cidade: ${paciente.endereco?.cidade || 'N/A'}
            `.trim();
            
            alert(detalhes);
        }
    }

    verTodosPacientes() {
        showNotification('Funcionalidade de listagem completa em desenvolvimento', 'info');
    }
}

// Tornar métodos disponíveis globalmente para onclick
let pageInstance;

// Inicializar página quando DOM carregado
document.addEventListener('DOMContentLoaded', () => {
    pageInstance = new CadastroPacientePage();
    
    // Tornar métodos disponíveis globalmente
    window.editarPaciente = (id) => pageInstance.editarPaciente(id);
    window.verDetalhes = (id) => pageInstance.verDetalhes(id);
});