// Funções de validação

// Validar CPF
export function validarCPF(cpf) {
  if (!cpf) return false;
  
  // Remover caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Validar dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;
  
  return true;
}

// Formatar CPF
export function formatarCPF(cpf) {
  if (!cpf) return '';
  
  const numeros = cpf.replace(/\D/g, '');
  
  if (numeros.length <= 11) {
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
}

// Validar e-mail
export function validarEmail(email) {
  if (!email) return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar telefone
export function validarTelefone(telefone) {
  if (!telefone) return false;
  
  const numeros = telefone.replace(/\D/g, '');
  return numeros.length >= 10 && numeros.length <= 11;
}

// Validar CEP
export function validarCEP(cep) {
  if (!cep) return false;
  
  const numeros = cep.replace(/\D/g, '');
  return numeros.length === 8;
}

// Formatar CEP
export function formatarCEP(cep) {
  if (!cep) return '';
  
  const numeros = cep.replace(/\D/g, '');
  
  if (numeros.length <= 8) {
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
}

// Validar data
export function validarData(data) {
  if (!data) return false;
  
  const date = new Date(data);
  return !isNaN(date.getTime()) && date <= new Date();
}

// Validar idade mínima
export function validarIdadeMinima(dataNascimento, idadeMinima = 18) {
  if (!dataNascimento) return false;
  
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  
  if (isNaN(nascimento.getTime())) return false;
  
  const idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  if (mesAtual < mesNascimento || 
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    return idade - 1 >= idadeMinima;
  }
  
  return idade >= idadeMinima;
}

// Validar senha forte
export function validarSenhaForte(senha) {
  if (!senha) return { valida: false, mensagem: 'Senha é obrigatória' };
  
  if (senha.length < 8) {
    return { valida: false, mensagem: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve ter pelo menos uma letra maiúscula' };
  }
  
  if (!/[a-z]/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve ter pelo menos uma letra minúscula' };
  }
  
  if (!/\d/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve ter pelo menos um número' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve ter pelo menos um caractere especial' };
  }
  
  return { valida: true, mensagem: 'Senha válida' };
}

// Validar campos obrigatórios de um formulário
export function validarCamposObrigatorios(form) {
  const camposObrigatorios = form.querySelectorAll('[required]');
  const erros = [];
  
  camposObrigatorios.forEach(campo => {
    if (!campo.value || campo.value.trim() === '') {
      const label = form.querySelector(`label[for="${campo.id}"]`);
      const nomeCampo = label ? label.textContent : campo.name || campo.id;
      erros.push(`${nomeCampo} é obrigatório`);
      
      // Adicionar classe de erro
      campo.classList.add('border-red-500');
    } else {
      // Remover classe de erro
      campo.classList.remove('border-red-500');
    }
  });
  
  return {
    valido: erros.length === 0,
    erros: erros
  };
}

// Validar formulário completo
export function validarFormulario(form) {
  const resultados = {
    valido: true,
    erros: []
  };
  
  // Validar campos obrigatórios
  const validacaoObrigatorios = validarCamposObrigatorios(form);
  if (!validacaoObrigatorios.valido) {
    resultados.valido = false;
    resultados.erros.push(...validacaoObrigatorios.erros);
  }
  
  // Validações específicas por tipo de campo
  const campos = form.querySelectorAll('input, select, textarea');
  
  campos.forEach(campo => {
    if (!campo.value) return; // Pular campos vazios (já validados acima)
    
    switch (campo.type) {
      case 'email':
        if (!validarEmail(campo.value)) {
          resultados.valido = false;
          resultados.erros.push('E-mail inválido');
          campo.classList.add('border-red-500');
        } else {
          campo.classList.remove('border-red-500');
        }
        break;
        
      case 'tel':
        if (!validarTelefone(campo.value)) {
          resultados.valido = false;
          resultados.erros.push('Telefone inválido');
          campo.classList.add('border-red-500');
        } else {
          campo.classList.remove('border-red-500');
        }
        break;
        
      case 'date':
        if (!validarData(campo.value)) {
          resultados.valido = false;
          resultados.erros.push('Data inválida');
          campo.classList.add('border-red-500');
        } else {
          campo.classList.remove('border-red-500');
        }
        break;
    }
    
    // Validações por atributos customizados
    if (campo.dataset.validacao === 'cpf') {
      if (!validarCPF(campo.value)) {
        resultados.valido = false;
        resultados.erros.push('CPF inválido');
        campo.classList.add('border-red-500');
      } else {
        campo.classList.remove('border-red-500');
      }
    }
    
    if (campo.dataset.validacao === 'cep') {
      if (!validarCEP(campo.value)) {
        resultados.valido = false;
        resultados.erros.push('CEP inválido');
        campo.classList.add('border-red-500');
      } else {
        campo.classList.remove('border-red-500');
      }
    }
  });
  
  return resultados;
}

// Aplicar máscara em tempo real
export function aplicarMascara(input, tipo) {
  input.addEventListener('input', function() {
    switch (tipo) {
      case 'cpf':
        this.value = formatarCPF(this.value);
        break;
      case 'cep':
        this.value = formatarCEP(this.value);
        break;
      case 'telefone':
        this.value = formatarTelefone(this.value);
        break;
    }
  });
}

// Função auxiliar para formatar telefone
function formatarTelefone(valor) {
  if (!valor) return '';
  
  const numeros = valor.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return valor;
}