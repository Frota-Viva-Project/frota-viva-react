// src/Utils/ManipuladorApi.js

const BASE_URL = 'https://api-postgresql-kr87.onrender.com/v1/api';

// Modo de desenvolvimento - usar dados mockados se API falhar
const USE_MOCK_DATA = true;

// Helper para lidar com erros de rede
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper para fazer requisições com timeout e retry
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tempo de requisição excedido');
    }
    throw error;
  }
};

// ============= DADOS MOCKADOS =============

const MOCK_MANUTENCOES = [
  {
    id: 1,
    descServico: "Troca de óleo",
    custo: 350.00,
    dataInicio: "2024-10-07T00:00:00.000+00:00",
    dataConclusao: "2024-10-08T00:00:00.000+00:00",
    caminhao: { id: 1, placa: "ABC-1234" }
  },
  {
    id: 2,
    descServico: "Revisão de freios",
    custo: 850.00,
    dataInicio: "2024-10-14T00:00:00.000+00:00",
    dataConclusao: "2024-10-14T00:00:00.000+00:00",
    caminhao: { id: 2, placa: "DEF-5678" }
  },
  {
    id: 3,
    descServico: "Alinhamento",
    custo: 200.00,
    dataInicio: "2024-10-23T00:00:00.000+00:00",
    dataConclusao: null,
    caminhao: { id: 1, placa: "ABC-1234" }
  },
  {
    id: 4,
    descServico: "Troca de pneus",
    custo: 1500.00,
    dataInicio: "2024-10-28T00:00:00.000+00:00",
    dataConclusao: null,
    caminhao: { id: 3, placa: "GHI-9012" }
  }
];

const MOCK_CAMINHOES = [
  {
    id: 1,
    placa: "ABC-1234",
    modelo: "Scania R450",
    ano: 2022,
    status: "ATIVO",
    motorista: { id: 1, nome: "Pedro Henrique Vicente Duarte" }
  },
  {
    id: 2,
    placa: "DEF-5678",
    modelo: "Volvo FH540",
    ano: 2021,
    status: "ATIVO",
    motorista: { id: 2, nome: "João Silva Santos" }
  },
  {
    id: 3,
    placa: "GHI-9012",
    modelo: "Mercedes-Benz Actros",
    ano: 2023,
    status: "INATIVO",
    motorista: { id: 3, nome: "Maria Oliveira Costa" }
  }
];

const MOCK_ALERTAS = [
  {
    id: 1,
    titulo: "Combustível baixo",
    categoria: "URGENTE",
    descricao: "Combustível em 5%",
    caminhaoId: 1
  },
  {
    id: 2,
    titulo: "Manutenção programada",
    categoria: "AVISO",
    descricao: "Manutenção agendada para amanhã",
    caminhaoId: 2
  }
];

// ============= MANUTENÇÕES =============

// Buscar todas as manutenções de um caminhão
export const getManutencoesCaminhao = async (caminhaoId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manutencao/caminhao/${caminhaoId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error);
    if (USE_MOCK_DATA) {
      console.log('Usando dados mockados para manutenções do caminhão');
      return MOCK_MANUTENCOES.filter(m => m.caminhao.id === caminhaoId);
    }
    throw error;
  }
};

// Buscar todas as manutenções (de todos os caminhões)
export const getTodasManutencoes = async () => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manutencao`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao buscar todas manutenções:', error);
    if (USE_MOCK_DATA) {
      console.log('Usando dados mockados para todas as manutenções');
      return MOCK_MANUTENCOES;
    }
    throw error;
  }
};

// Criar nova manutenção
export const criarManutencao = async (manutencaoData) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manutencao`, {
      method: 'POST',
      body: JSON.stringify(manutencaoData)
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    if (USE_MOCK_DATA) {
      console.log('Simulando criação de manutenção');
      return { ...manutencaoData, id: Date.now() };
    }
    throw error;
  }
};

// Atualizar manutenção
export const atualizarManutencao = async (id, manutencaoData) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manutencao/${id}`, {
      method: 'PUT',
      body: JSON.stringify(manutencaoData)
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    if (USE_MOCK_DATA) {
      console.log('Simulando atualização de manutenção');
      return { ...manutencaoData, id };
    }
    throw error;
  }
};

// Deletar manutenção
export const deletarManutencao = async (id) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manutencao/${id}`, {
      method: 'DELETE'
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao deletar manutenção:', error);
    if (USE_MOCK_DATA) {
      console.log('Simulando exclusão de manutenção');
      return { success: true };
    }
    throw error;
  }
};

// ============= ALERTAS =============

// Criar alerta
export const criarAlerta = async (caminhaoId, alertaData) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/alerta/${caminhaoId}`, {
      method: 'POST',
      body: JSON.stringify(alertaData)
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    if (USE_MOCK_DATA) {
      console.log('Simulando criação de alerta');
      return { ...alertaData, id: Date.now(), caminhaoId };
    }
    throw error;
  }
};

// Buscar alertas de um caminhão
export const getAlertasCaminhao = async (caminhaoId) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/alerta/caminhao/${caminhaoId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    if (USE_MOCK_DATA) {
      console.log('Usando dados mockados para alertas');
      return MOCK_ALERTAS.filter(a => a.caminhaoId === caminhaoId);
    }
    throw error;
  }
};

// ============= CAMINHÕES =============

// Buscar todos os caminhões
export const getTodosCaminhoes = async () => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/caminhao`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao buscar caminhões:', error);
    if (USE_MOCK_DATA) {
      console.log('Usando dados mockados para caminhões');
      return MOCK_CAMINHOES;
    }
    throw error;
  }
};

// Buscar caminhão por ID
export const getCaminhaoPorId = async (id) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/caminhao/${id}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro ao buscar caminhão:', error);
    if (USE_MOCK_DATA) {
      console.log('Usando dados mockados para caminhão');
      return MOCK_CAMINHOES.find(c => c.id === id) || null;
    }
    throw error;
  }
};

// ============= FUNÇÕES AUXILIARES =============

// Filtrar manutenções marcadas (sem data de conclusão)
export const getManutencoesMarcadas = (manutencoes) => {
  return manutencoes.filter(m => m.dataConclusao === null);
};

// Filtrar manutenções concluídas (com data de conclusão)
export const getManutencoesConcluidas = (manutencoes) => {
  return manutencoes.filter(m => m.dataConclusao !== null);
};

// Calcular gasto total de manutenções
export const calcularGastoTotal = (manutencoes) => {
  return manutencoes.reduce((total, m) => total + (m.custo || 0), 0);
};

// Formatar data para exibição (DD/MM/YYYY)
export const formatarData = (dataString) => {
  if (!dataString) return 'N/A';
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// Formatar data curta (DD/MM)
export const formatarDataCurta = (dataString) => {
  if (!dataString) return 'N/A';
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
};

// Verificar se manutenção está atrasada
export const isManutencaoAtrasada = (manutencao) => {
  if (manutencao.dataConclusao) return false; // Já concluída
  const hoje = new Date();
  const dataInicio = new Date(manutencao.dataInicio);
  const diasDiferenca = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
  return diasDiferenca > 7; // Considerando 7 dias como prazo
};

// Agrupar gastos por tipo (descServico)
export const agruparGastosPorTipo = (manutencoes) => {
  const grupos = {};
  manutencoes.forEach(m => {
    const tipo = m.descServico || 'Outros';
    if (!grupos[tipo]) {
      grupos[tipo] = {
        tipo,
        total: 0,
        quantidade: 0,
        manutencoes: []
      };
    }
    grupos[tipo].total += m.custo || 0;
    grupos[tipo].quantidade += 1;
    grupos[tipo].manutencoes.push(m);
  });
  return Object.values(grupos);
};

// Encontrar veículo com mais problemas
export const getVeiculoMaisProblemas = (manutencoes) => {
  const veiculos = {};
  manutencoes.forEach(m => {
    const veiculoId = m.caminhao?.id || 'Desconhecido';
    if (!veiculos[veiculoId]) {
      veiculos[veiculoId] = {
        id: veiculoId,
        placa: m.caminhao?.placa || 'N/A',
        quantidade: 0,
        custoTotal: 0
      };
    }
    veiculos[veiculoId].quantidade += 1;
    veiculos[veiculoId].custoTotal += m.custo || 0;
  });
  
  const lista = Object.values(veiculos);
  if (lista.length === 0) return null;
  
  return lista.reduce((max, v) => v.quantidade > max.quantidade ? v : max);
};

// Filtrar manutenções do mês atual
export const getManutencoesMesAtual = (manutencoes) => {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  return manutencoes.filter(m => {
    const data = new Date(m.dataInicio);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });
};

export default {
  getManutencoesCaminhao,
  getTodasManutencoes,
  criarManutencao,
  atualizarManutencao,
  deletarManutencao,
  criarAlerta,
  getAlertasCaminhao,
  getTodosCaminhoes,
  getCaminhaoPorId,
  getManutencoesMarcadas,
  getManutencoesConcluidas,
  calcularGastoTotal,
  formatarData,
  formatarDataCurta,
  isManutencaoAtrasada,
  agruparGastosPorTipo,
  getVeiculoMaisProblemas,
  getManutencoesMesAtual
};