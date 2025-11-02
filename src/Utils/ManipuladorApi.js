const BASE_URL = import.meta.env.DEV
  ? '/v1/api'
  : 'https://api-postgresql-kr87.onrender.com/v1/api';

const AUTH_URL = import.meta.env.DEV
  ? '/v1/api/auth/login'
  : 'https://api-postgresql-kr87.onrender.com/v1/api/auth/login';

const API_CREDENTIALS = {
  username: 'frotaviva',
  password: 'frotavia_1_2_3'
};

// Detectar automaticamente se deve usar dados mockados
let USE_MOCK_DATA = false;
let API_AVAILABLE = null; // null = não testado, true = disponível, false = indisponível

// Armazenamento do token em memória
let authToken = null;
let tokenExpiry = null;
let loginPromise = null;

// Cache simples em memória para reduzir chamadas repetidas
const cache = {
  data: {},
  timestamps: {},
  TTL: 30000, // 30 segundos

  get(key) {
    const now = Date.now();
    if (this.data[key] && (now - this.timestamps[key]) < this.TTL) {
      console.log(`📦 Cache hit: ${key}`);
      return this.data[key];
    }
    return null;
  },

  set(key, value) {
    this.data[key] = value;
    this.timestamps[key] = Date.now();
  },

  clear() {
    this.data = {};
    this.timestamps = {};
  }
};

// ============= AUTENTICAÇÃO =============

export const login = async () => {
  if (loginPromise) {
    console.log('🔄 Aguardando login em andamento...');
    return loginPromise;
  }

  loginPromise = (async () => {
    try {
      console.log('🔐 Realizando autenticação...');
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(API_CREDENTIALS),
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Erro na autenticação: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      authToken = data.token || data.accessToken || data.bearer || data;
      tokenExpiry = Date.now() + (50 * 60 * 1000);

      console.log('✅ Autenticação realizada com sucesso');
      return authToken;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);

      // Só ativar modo offline se for erro de conectividade
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('📦 Ativando modo offline devido a erro de conectividade');
        API_AVAILABLE = false;
        USE_MOCK_DATA = true;
        return 'mock-token';
      } else {
        // Para erros de autenticação (401, 403, etc), não ativar modo offline
        console.log('⚠️ Erro de autenticação, mas API está disponível');
        authToken = null;
        tokenExpiry = null;
        throw error; // Re-throw para que o erro seja tratado pelo chamador
      }
    } finally {
      loginPromise = null;
    }
  })();

  return loginPromise;
};

const isTokenValid = () => {
  return authToken && tokenExpiry && Date.now() < tokenExpiry;
};

const getValidToken = async () => {
  // Se estiver usando dados mockados, retornar token mock
  if (USE_MOCK_DATA) {
    return 'mock-token';
  }

  // Primeiro, tentar obter token do localStorage
  if (!authToken) {
    try {
      const tokenSalvo = localStorage.getItem('frotaViva_token');
      if (tokenSalvo) {
        console.log('🔑 Usando token do localStorage');
        authToken = tokenSalvo;
        tokenExpiry = Date.now() + (50 * 60 * 1000); // Assumir 50 min de validade
      }
    } catch (error) {
      console.warn('⚠️ Erro ao obter token do localStorage:', error);
    }
  }

  if (!isTokenValid()) {
    console.log('🔄 Token inválido ou expirado, renovando...');
    try {
      await login();
    } catch (error) {
      // Se falhar na autenticação, ativar modo mock temporariamente
      console.log('⚠️ Falha na autenticação, usando modo mock temporário');
      USE_MOCK_DATA = true;
      return 'mock-token';
    }
  }
  return authToken || 'mock-token';
};

export const logout = () => {
  console.log('Realizando logout...');
  authToken = null;
  tokenExpiry = null;
  loginPromise = null;
  cache.clear();

  // Limpar token do localStorage
  try {
    localStorage.removeItem('frotaViva_token');
  } catch (error) {
    console.warn('Erro ao limpar token do localStorage:', error);
  }
};

export const clearCache = () => {
  console.log('Limpando cache...');
  cache.clear();
};

// ============= HELPERS DE REQUISIÇÃO =============

const handleResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    console.log('Token inválido (401/403), limpando token...');
    authToken = null;
    tokenExpiry = null;
    throw new Error('TOKEN_EXPIRED');
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    } catch (e) { }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;

  return response.json();
};

const fetchWithTimeout = async (url, options = {}, timeout = 15000, retryCount = 0, maxRetries = 2) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Verifica cache para requisições GET
  const cacheKey = `${options.method || 'GET'}_${url}`;
  if (!options.method || options.method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const token = await getValidToken();

    console.log(`Requisição ${retryCount > 0 ? `(tentativa ${retryCount + 1})` : ''} para: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    console.log(`Resposta recebida de: ${url} (Status: ${response.status})`);

    try {
      const data = await handleResponse(response);

      if ((!options.method || options.method === 'GET') && data) {
        cache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      if (error.message === 'TOKEN_EXPIRED' && retryCount === 0) {
        console.log('Tentando novamente com novo token...');
        authToken = null;
        tokenExpiry = null;
        await getValidToken();
        return fetchWithTimeout(url, options, timeout, retryCount + 1, maxRetries);
      }

      if (error.message.includes('500') && retryCount < maxRetries) {
        console.log(`Erro 500 detectado, tentando novamente (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchWithTimeout(url, options, timeout, retryCount + 1, maxRetries);
      }

      throw error;
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' && retryCount < maxRetries) {
      console.log(`⚠️ Timeout detectado, tentando novamente (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithTimeout(url, options, timeout, retryCount + 1, maxRetries);
    }

    console.error(`Erro na requisição para ${url}:`, error);

    if (error.name === 'AbortError') {
      throw new Error('Tempo de requisição excedido (15s)');
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

// ============= VERIFICAÇÃO DA API =============
export const checkApiStatus = async () => {
  if (API_AVAILABLE !== null) {
    return API_AVAILABLE;
  }

  try {
    console.log('🔍 Verificando disponibilidade da API...');

    // Tentar uma requisição simples primeiro
    const testResponse = await fetch(`${BASE_URL}/caminhoes/2`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });

    // API está respondendo se retornar qualquer status HTTP válido
    if (testResponse.status >= 200 && testResponse.status < 600) {
      API_AVAILABLE = true;
      USE_MOCK_DATA = false;
      console.log(`✅ API está disponível (Status: ${testResponse.status})`);
      return true;
    } else {
      throw new Error(`API retornou status inválido: ${testResponse.status}`);
    }
  } catch (error) {
    // Só ativar modo offline se for erro de conectividade real
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('❌ Erro de conectividade:', error.message);
      console.log('📦 Ativando modo offline com dados mockados');
      API_AVAILABLE = false;
      USE_MOCK_DATA = true;
      return false;
    } else {
      // Para outros erros, assumir que API está disponível mas com problemas
      console.log('⚠️ API com problemas mas disponível:', error.message);
      API_AVAILABLE = true;
      USE_MOCK_DATA = false;
      return true;
    }
  }
};

// Função para mostrar status da API
export const getApiStatus = () => {
  return {
    available: API_AVAILABLE,
    usingMockData: USE_MOCK_DATA,
    baseUrl: BASE_URL,
    hasToken: !!authToken
  };
};

// Função para forçar modo offline
export const forcarModoOffline = () => {
  console.log('🔄 Forçando modo offline...');
  API_AVAILABLE = false;
  USE_MOCK_DATA = true;
  authToken = null;
  tokenExpiry = null;
};

// Função para resetar estado da API
export const resetarEstadoAPI = () => {
  console.log('🔄 Resetando estado da API...');
  API_AVAILABLE = null;
  USE_MOCK_DATA = false;
  authToken = null;
  tokenExpiry = null;
  loginPromise = null;
  cache.clear();
};

// Função para tentar reconectar com a API
export const tentarReconectar = async () => {
  console.log('🔄 Tentando reconectar com a API...');
  resetarEstadoAPI();

  try {
    // Tentar fazer login primeiro
    await login();
    console.log('✅ Reconectado e autenticado com sucesso!');
    return true;
  } catch (error) {
    console.log('❌ Falha na reconexão:', error.message);
    return false;
  }
};

// Função para testar todos os endpoints
export const testarEndpoints = async () => {
  console.log('🧪 Testando endpoints da API...');
  console.log('📊 Status atual:', getApiStatus());

  const testes = [
    {
      nome: 'Caminhões',
      funcao: () => getTodosCaminhoes()
    },
    {
      nome: 'Manutenções',
      funcao: () => getTodasManutencoes()
    },
    {
      nome: 'Alertas (Caminhão 1)',
      funcao: () => getAlertasCaminhao(1)
    }
  ];

  for (const teste of testes) {
    try {
      console.log(`🔍 Testando: ${teste.nome}`);
      const resultado = await teste.funcao();
      console.log(`✅ ${teste.nome}:`, resultado?.length || 0, 'itens');
    } catch (error) {
      console.error(`❌ ${teste.nome}:`, error.message);
    }
  }

  console.log('📊 Status final:', getApiStatus());
};

// Expor funções globalmente para debug no console
if (typeof window !== 'undefined') {
  window.FrotaVivaAPI = {
    testarEndpoints,
    getApiStatus,
    resetarEstadoAPI,
    tentarReconectar,
    forcarModoOffline,
    login
  };

  console.log('🔧 Funções de debug disponíveis em window.FrotaVivaAPI:');
  console.log('  - testarEndpoints(): Testa todos os endpoints');
  console.log('  - getApiStatus(): Mostra status atual da API');
  console.log('  - resetarEstadoAPI(): Reseta estado da API');
  console.log('  - tentarReconectar(): Tenta reconectar com a API');
  console.log('  - forcarModoOffline(): Força modo offline');
  console.log('  - login(): Tenta fazer login manualmente');
}

// ============= MANUTENÇÕES =============

export const getTodasManutencoes = async () => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para todas as manutenções');
    return MOCK_MANUTENCOES;
  }

  try {
    console.log('🔄 Buscando manutenções por caminhão (endpoint /manutencao não existe)...');

    // Buscar caminhões primeiro
    const caminhoes = await getTodosCaminhoes();
    if (!caminhoes || caminhoes.length === 0) {
      console.log('⚠️ Nenhum caminhão encontrado, usando dados mockados');
      return MOCK_MANUTENCOES;
    }

    // Buscar manutenções de cada caminhão
    const todasManutencoes = [];
    const promises = caminhoes.slice(0, 3).map(async (caminhao) => { // Limitar a 3 caminhões
      try {
        const manutencoes = await getManutencoesCaminhao(caminhao.id);
        return manutencoes || [];
      } catch (err) {
        console.warn(`⚠️ Erro ao buscar manutenções do caminhão ${caminhao.id}`);
        return [];
      }
    });

    const resultados = await Promise.allSettled(promises);
    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value) {
        todasManutencoes.push(...resultado.value);
      }
    });

    if (todasManutencoes.length > 0) {
      console.log(`✅ Manutenções carregadas: ${todasManutencoes.length}`);
      return todasManutencoes;
    }

    console.log('⚠️ Nenhuma manutenção encontrada, usando dados mockados');
    return MOCK_MANUTENCOES;
  } catch (error) {
    console.log('⚠️ Erro ao buscar manutenções:', error.message);
    return MOCK_MANUTENCOES;
  }
};

export const getManutencoesCaminhao = async (caminhaoId) => {
  if (USE_MOCK_DATA) {
    console.log(`📦 Usando dados mockados para manutenções do caminhão ${caminhaoId}`);
    return MOCK_MANUTENCOES.filter(m => m.caminhao.id === caminhaoId);
  }

  try {
    // Corrigir endpoint para usar o formato correto
    const data = await fetchWithTimeout(`${BASE_URL}/manutencao/caminhao/${caminhaoId}`);
    console.log(`✅ Manutenções do caminhão ${caminhaoId}:`, data?.length || 0);
    return data || [];
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar manutenções do caminhão ${caminhaoId}:`, error.message);

    // Se for erro de conectividade, ativar modo mock
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('📦 Ativando modo mock devido a erro de conectividade');
      USE_MOCK_DATA = true;
    }

    return MOCK_MANUTENCOES.filter(m => m.caminhao.id === caminhaoId);
  }
};

export const criarManutencao = async (caminhaoId, manutencaoData) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Simulando criação de manutenção');
    return {
      ...manutencaoData,
      id: Date.now(),
      caminhao: MOCK_CAMINHOES.find(c => c.id === caminhaoId)
    };
  }

  try {
    const data = await fetchWithTimeout(`${BASE_URL}/manutencao/caminhao/${caminhaoId}`, {
      method: 'POST',
      body: JSON.stringify(manutencaoData)
    });
    clearCache();
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar manutenção:', error);
    throw error;
  }
};

export const atualizarManutencao = async (id, manutencaoData) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Simulando atualização de manutenção');
    return { ...manutencaoData, id };
  }

  try {
    const data = await fetchWithTimeout(`${BASE_URL}/manutencao/${id}`, {
      method: 'PUT',
      body: JSON.stringify(manutencaoData)
    });
    clearCache();
    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar manutenção:', error);
    throw error;
  }
};

export const deletarManutencao = async (id) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Simulando exclusão de manutenção');
    return { success: true };
  }

  try {
    const data = await fetchWithTimeout(`${BASE_URL}/manutencao/${id}`, {
      method: 'DELETE'
    });
    clearCache();
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro ao deletar manutenção:', error);
    throw error;
  }
};

export const getHistoricoVeiculo = async (veiculoId) => {
  if (USE_MOCK_DATA) {
    console.log(`📦 Usando dados mockados para histórico do veículo ${veiculoId}`);
    return {
      historicoModificacoes: [
        {
          dataModificacao: "2025-10-29T14:17:01.981+00:00",
          tipo: "Preventiva",
          descricao: "Troca de óleo e filtros",
          pecasTrocadas: [
            { nomePeca: "Óleo do motor", custo: 150, quilometragemTroca: 85000 },
            { nomePeca: "Filtro de óleo", custo: 45, quilometragemTroca: 85000 }
          ],
          provedorServico: "Oficina Central",
          custoTotal: 195,
          quilometragem: 85000
        }
      ],
      historicoAcidentes: [
        {
          dataAcidente: "2025-10-29T14:20:45.279+00:00",
          tipoAcidente: "Colisão traseira",
          gravidade: "Leve",
          descricao: "Pequeno arranhão no para-choque",
          custoReparo: 800,
          seguroCobriu: true,
          laudoTecnico: "Danos superficiais"
        }
      ],
      upgradesRealizados: [
        {
          dataUpgrade: "2025-10-29T14:13:47.322+00:00",
          tipoUpgrade: "Sistema de rastreamento",
          componentes: ["GPS", "Sensor de combustível"],
          custo: 1200,
          melhoriasEsperadas: "Melhor controle da frota",
          resultadosObservados: "Redução de 15% no consumo"
        }
      ]
    };
  }

  try {
    console.log(`🔍 Buscando histórico do veículo ${veiculoId} via API MongoDB...`);

    // Usar proxy local em desenvolvimento, URL direta em produção
    const apiUrl = import.meta.env.DEV
      ? `/api/veiculos/${veiculoId}/historico`
      : `https://api-mongodb-o0hu.onrender.com/api/veiculos/${veiculoId}/historico`;

    console.log(`🌐 URL da API: ${apiUrl} (DEV: ${import.meta.env.DEV})`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Histórico recebido da API MongoDB:', data);
    console.log(`📊 Tipos de dados encontrados:`, {
      modificacoes: data.historicoModificacoes?.length || 0,
      acidentes: data.historicoAcidentes?.length || 0,
      upgrades: data.upgradesRealizados?.length || 0
    });

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico do veículo:', error);

    // Fallback para dados mockados em caso de erro
    console.log('🔄 Usando dados mockados como fallback...');
    return {
      historicoModificacoes: [
        {
          dataModificacao: new Date().toISOString(),
          tipo: "Preventiva",
          descricao: "Troca de óleo e filtros (dados de exemplo)",
          pecasTrocadas: [
            { nomePeca: "Óleo do motor", custo: 150, quilometragemTroca: 85000 }
          ],
          provedorServico: "Oficina Central",
          custoTotal: 195,
          quilometragem: 85000
        }
      ],
      historicoAcidentes: [],
      upgradesRealizados: []
    };
  }
};

// ============= ALERTAS =============

export const getAlertasCaminhao = async (caminhaoId) => {
  if (USE_MOCK_DATA) {
    console.log(`📦 Usando dados mockados para alertas do caminhão ${caminhaoId}`);
    return MOCK_ALERTAS.filter(a => a.caminhaoId === caminhaoId);
  }

  try {
    const data = await fetchWithTimeout(`${BASE_URL}/alerta/${caminhaoId}`);
    console.log(`✅ Alertas do caminhão ${caminhaoId}:`, data?.length || 0);
    return data || [];
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar alertas do caminhão ${caminhaoId}:`, error.message);

    if (error.message.includes('500')) {
      console.log(`ℹ️ Caminhão ${caminhaoId} pode não ter alertas cadastrados`);
      return [];
    }

    return [];
  }
};

export const getTodosAlertas = async () => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para todos os alertas');
    return MOCK_ALERTAS;
  }

  try {
    const caminhoes = await getTodosCaminhoes();

    if (!caminhoes || caminhoes.length === 0) {
      console.log('⚠️ Nenhum caminhão encontrado para buscar alertas');
      return [];
    }

    const caminhoesParaAlertas = caminhoes.slice(0, 5);
    console.log(`🔄 Buscando alertas de ${caminhoesParaAlertas.length} caminhões...`);

    const promises = caminhoesParaAlertas.map(async (caminhao) => {
      try {
        return await getAlertasCaminhao(caminhao.id);
      } catch (err) {
        console.warn(`⚠️ Falha ao buscar alertas do caminhão ${caminhao.id}`);
        return [];
      }
    });

    const resultados = await Promise.allSettled(promises);
    const todosAlertas = [];

    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value) {
        todosAlertas.push(...resultado.value);
      }
    });

    console.log(`✅ Total de alertas carregados: ${todosAlertas.length}`);
    return todosAlertas;
  } catch (error) {
    console.error('❌ Erro ao buscar todos os alertas:', error.message);
    return [];
  }
};

export const criarAlerta = async (caminhaoId, alertaData) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Simulando criação de alerta');
    return { ...alertaData, id: Date.now(), caminhaoId };
  }

  try {
    // Endpoint correto baseado na imagem: POST /v1/api/alerta/{id_caminhao}
    // O body deve conter: titulo, categoria, descricao
    const data = await fetchWithTimeout(`${BASE_URL}/alerta/${caminhaoId}`, {
      method: 'POST',
      body: JSON.stringify({
        titulo: alertaData.titulo || alertaData.title || 'Alerta',
        categoria: alertaData.categoria || alertaData.category || 'AVISO',
        descricao: alertaData.descricao || alertaData.description || ''
      })
    });
    clearCache();
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar alerta:', error);
    throw error;
  }
};

// ============= CAMINHÕES =============

export const getTodosCaminhoes = async () => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para caminhões');
    return MOCK_CAMINHOES;
  }

  try {
    // Endpoint correto baseado na imagem: /v1/api/caminhoes/{id_motorista}
    // Vamos tentar primeiro buscar todos os caminhões sem ID específico
    const data = await fetchWithTimeout(`${BASE_URL}/caminhoes/2`); // Usando ID 2 como padrão
    console.log('✅ Caminhões carregados da API:', data?.length || 0);
    return Array.isArray(data) ? data : [data]; // Garantir que retorna array
  } catch (error) {
    console.error('❌ Erro ao buscar caminhões:', error.message);

    // Se for erro de conectividade, ativar modo mock
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('📦 Ativando modo mock devido a erro de conectividade');
      USE_MOCK_DATA = true;
    }

    return MOCK_CAMINHOES;
  }
};

// Buscar caminhão por ID do motorista (baseado na imagem)
export const getCaminhaoPorId = async (id_motorista) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para caminhão');
    return MOCK_CAMINHOES.find(c => c.id === id_motorista) || null;
  }

  try {
    // Endpoint correto: /v1/api/caminhoes/{id_motorista}
    const data = await fetchWithTimeout(`${BASE_URL}/caminhoes/${id_motorista}`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar caminhão:', error);
    return MOCK_CAMINHOES.find(c => c.id === id_motorista) || null;
  }
};

// Buscar caminhões com endpoint correto
export const getCaminhoes = async () => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para caminhões');
    return MOCK_CAMINHOES;
  }

  try {
    // Tentar buscar com diferentes IDs de motorista
    const idsMotorista = [1, 2, 3]; // IDs comuns de motoristas
    const promises = idsMotorista.map(async (id) => {
      try {
        const data = await fetchWithTimeout(`${BASE_URL}/caminhoes/${id}`);
        return data;
      } catch (err) {
        console.warn(`⚠️ Erro ao buscar caminhão do motorista ${id}:`, err.message);
        return null;
      }
    });

    const resultados = await Promise.allSettled(promises);
    const caminhoes = [];

    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value) {
        if (Array.isArray(resultado.value)) {
          caminhoes.push(...resultado.value);
        } else {
          caminhoes.push(resultado.value);
        }
      }
    });

    console.log('✅ Caminhões carregados da API:', caminhoes.length);
    return caminhoes.length > 0 ? caminhoes : MOCK_CAMINHOES;
  } catch (error) {
    console.error('❌ Erro ao buscar caminhões:', error.message);
    return MOCK_CAMINHOES;
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
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    return 'Data inválida';
  }
};

// Formatar data curta (DD/MM)
export const formatarDataCurta = (dataString) => {
  if (!dataString) return 'N/A';
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'N/A';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  } catch (error) {
    return 'N/A';
  }
};

// Verificar se manutenção está atrasada
export const isManutencaoAtrasada = (manutencao) => {
  if (manutencao.dataConclusao) return false;

  try {
    const hoje = new Date();
    const dataInicio = new Date(manutencao.dataInicio);

    if (isNaN(dataInicio.getTime())) return false;

    const diasDiferenca = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
    return diasDiferenca > 7;
  } catch (error) {
    return false;
  }
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
    const placa = m.caminhao?.placa || 'N/A';

    if (!veiculos[veiculoId]) {
      veiculos[veiculoId] = {
        id: veiculoId,
        placa: placa,
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
    try {
      const data = new Date(m.dataInicio);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    } catch (error) {
      return false;
    }
  });
};

// Calcular estatísticas da frota
export const getEstatisticasFrota = (caminhoes, manutencoes) => {
  const frotaAtiva = caminhoes.filter(c => c.status === 'ATIVO').length;
  const frotaInativa = caminhoes.filter(c => c.status === 'INATIVO').length;
  const frotaTotal = caminhoes.length;

  const manutencoesPendentes = getManutencoesMarcadas(manutencoes).length;
  const manutencoesConcluidas = getManutencoesConcluidas(manutencoes).length;
  const gastoTotal = calcularGastoTotal(manutencoes);

  return {
    frotaAtiva,
    frotaInativa,
    frotaTotal,
    manutencoesPendentes,
    manutencoesConcluidas,
    gastoTotal
  }
};

// ============= RELATÓRIOS IA =============

export const gerarRelatorioIA = async (dadosManutencoes, dadosCaminhoes) => {
  try {
    console.log('🤖 Gerando relatório com IA via API...');

    // Preparar dados para o prompt
    const totalManutencoes = dadosManutencoes.length;
    const custoTotal = dadosManutencoes.reduce((total, m) => total + (m.custo || 0), 0);
    const manutencoesPendentes = dadosManutencoes.filter(m => !m.dataConclusao).length;
    const totalCaminhoes = dadosCaminhoes.length;

    const prompt = `Analise os seguintes dados da frota de caminhões e gere um relatório executivo:

DADOS DA FROTA:
- Total de caminhões: ${totalCaminhoes}
- Total de manutenções: ${totalManutencoes}
- Manutenções pendentes: ${manutencoesPendentes}
- Custo total de manutenções: R$ ${custoTotal.toLocaleString('pt-BR')}

ÚLTIMAS MANUTENÇÕES:
${dadosManutencoes.slice(-5).map(m =>
      `- ${m.caminhao?.placa || 'N/A'}: ${m.descServico} - R$ ${(m.custo || 0).toLocaleString('pt-BR')} (${m.dataConclusao ? 'Concluída' : 'Pendente'})`
    ).join('\n')}

Por favor, gere um relatório executivo com:
1. Resumo da situação atual da frota
2. Principais insights sobre custos e manutenções
3. Recomendações para otimização
4. Alertas importantes

Mantenha o relatório conciso e focado em ações práticas.`;

    console.log('📡 Fazendo requisição para API de IA...');
    const response = await fetchWithTimeout('https://chatbot-api-xung.onrender.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YavTaa8pb22HceJNgBcD4N9ruWSsTygN'
      },
      body: JSON.stringify({
        mensagem: prompt,
        session_id: "frota_viva_relatorio"
      })
    }, 30000); // 30 segundos timeout para IA

    if (!response.ok) {
      console.log(`❌ Erro na API da IA: ${response.status}`)
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Relatório gerado com sucesso');

    return {
      relatorio: data.resposta || data.message || data.response || 'Relatório gerado com sucesso',
      timestamp: new Date().toISOString(),
      dadosUtilizados: {
        totalManutencoes,
        custoTotal,
        manutencoesPendentes,
        totalCaminhoes
      }
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);

    // Fallback com relatório básico
    const custoTotal = dadosManutencoes.reduce((total, m) => total + (m.custo || 0), 0);
    const manutencoesPendentes = dadosManutencoes.filter(m => !m.dataConclusao).length;

    return {
      relatorio: `RELATÓRIO EXECUTIVO DA FROTA

📊 RESUMO ATUAL:
• Total de caminhões: ${dadosCaminhoes.length}
• Manutenções registradas: ${dadosManutencoes.length}
• Manutenções pendentes: ${manutencoesPendentes}
• Investimento total: R$ ${custoTotal.toLocaleString('pt-BR')}

⚠️ ALERTAS:
${manutencoesPendentes > 0 ? `• ${manutencoesPendentes} manutenções pendentes requerem atenção` : '• Todas as manutenções estão em dia'}
${custoTotal > 10000 ? '• Custos de manutenção elevados - revisar fornecedores' : '• Custos de manutenção dentro do esperado'}

💡 RECOMENDAÇÕES:
• Implementar manutenção preventiva para reduzir custos
• Monitorar veículos com maior frequência de problemas
• Considerar renovação da frota para veículos com alto custo de manutenção

(Relatório gerado automaticamente - API de IA indisponível)`,
      timestamp: new Date().toISOString(),
      dadosUtilizados: {
        totalManutencoes: dadosManutencoes.length,
        custoTotal,
        manutencoesPendentes,
        totalCaminhoes: dadosCaminhoes.length
      },
      fallback: true
    };
  }
};

// ============= MAPAS E ROTAS =============

export const getMapas = async () => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para mapas');
    return [];
  }

  try {
    // Tentar buscar mapas com diferentes IDs
    const idsMapas = [1, 2, 3]; // IDs comuns de mapas
    const promises = idsMapas.map(async (id) => {
      try {
        const data = await fetchWithTimeout(`${BASE_URL}/maps/${id}`);
        return data;
      } catch (err) {
        console.warn(`⚠️ Erro ao buscar mapa ${id}:`, err.message);
        return null;
      }
    });

    const resultados = await Promise.allSettled(promises);
    const mapas = [];

    resultados.forEach((resultado) => {
      if (resultado.status === 'fulfilled' && resultado.value) {
        mapas.push(resultado.value);
      }
    });

    console.log('✅ Mapas carregados da API:', mapas.length);
    return mapas;
  } catch (error) {
    console.error('❌ Erro ao buscar mapas:', error.message);
    return [];
  }
};

export const getMapaPorId = async (id_maps) => {
  if (USE_MOCK_DATA) {
    console.log('📦 Usando dados mockados para mapa');
    return {
      id: id_maps,
      latitude: -23.5405,
      longitude: -46.7050,
      destino: 'Av. dos Autonomistas, 1400 - Vila Yara, Osasco - SP',
      status: 'Em andamento',
      caminhao_id: 2
    };
  }

  try {
    // Endpoint correto baseado na imagem: GET /v1/api/maps/{id_maps}
    console.log(`📍 Buscando coordenadas via API: /v1/api/maps/${id_maps}`);
    const data = await fetchWithTimeout(`${BASE_URL}/maps/${id_maps}`);

    if (data) {
      console.log('✅ Coordenadas obtidas da API:', {
        latitude: data.latitude,
        longitude: data.longitude,
        destino: data.destino
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar coordenadas do mapa via API:', error);

    // Retornar dados de fallback com coordenadas padrão
    return {
      id: id_maps,
      latitude: -23.5405,
      longitude: -46.7050,
      destino: 'Localização não disponível',
      status: 'Erro ao carregar',
      caminhao_id: null,
      erro: error.message
    };
  }
};

// Função específica para buscar coordenadas de caminhões
export const getCoordenadasCaminhaoRota = async (id_maps) => {
  try {
    console.log(`🚛 Buscando coordenadas do caminhão via endpoint /v1/api/maps/${id_maps}`);

    const mapa = await getMapaPorId(id_maps);

    if (mapa && mapa.latitude && mapa.longitude) {
      return {
        latitude: parseFloat(mapa.latitude),
        longitude: parseFloat(mapa.longitude),
        altitude: mapa.altitude ? parseFloat(mapa.altitude) : null,
        endereco: mapa.destino || mapa.endereco,
        timestamp: mapa.timestamp || new Date().toISOString(),
        caminhao_id: mapa.caminhao_id
      };
    }

    throw new Error('Coordenadas não encontradas no mapa');
  } catch (error) {
    console.error('❌ Erro ao buscar coordenadas do caminhão:', error);
    throw error;
  }
};

// Função para buscar rotas do caminhão baseado na API mostrada na imagem
export const getRotasCaminhao = async (id_caminhao) => {
  if (USE_MOCK_DATA) {
    console.log(`📦 Usando dados mockados para rotas do caminhão ${id_caminhao}`);
    return [
      {
        id: 1,
        destinoInicial: "São Paulo",
        destinoFinal: "Rio de Janeiro",
        latitude: -23.5289,
        longitude: -46.6997,
        status: "ATIVO",
        dataHoraPrevisao: "2025-10-31T10:00:00.000Z"
      },
      {
        id: 2,
        destinoInicial: "Rio de Janeiro",
        destinoFinal: "Belo Horizonte",
        latitude: -23.5342,
        longitude: -46.6895,
        status: "ATIVO",
        dataHoraPrevisao: "2025-10-31T14:00:00.000Z"
      }
    ];
  }

  try {
    // Endpoint baseado na imagem: GET /v1/api/rota_caminhao/{id_caminhao}
    console.log(`🛣️ Buscando rotas do caminhão via API: /v1/api/rota_caminhao/${id_caminhao}`);
    const data = await fetchWithTimeout(`${BASE_URL}/rota_caminhao/${id_caminhao}`);

    if (data) {
      console.log(`✅ Rotas do caminhão ${id_caminhao} carregadas:`, data.length || 0);
      return Array.isArray(data) ? data : [data];
    }

    return [];
  } catch (error) {
    console.error(`❌ Erro ao buscar rotas do caminhão ${id_caminhao}:`, error);

    // Retornar dados mockados em caso de erro
    return [
      {
        id: 1,
        destinoInicial: "Localização atual",
        destinoFinal: "Destino não disponível",
        latitude: -23.5405,
        longitude: -46.7050,
        status: "ERRO",
        dataHoraPrevisao: new Date().toISOString(),
        erro: error.message
      }
    ];
  }
};

// Remover funções de entregas já que o endpoint não existe
// export const getEntregas = async () => {
//   console.log('⚠️ Endpoint de entregas não existe na API');
//   return [];
// };

// export const getEntregaPorId = async (id) => {
//   console.log('⚠️ Endpoint de entregas não existe na API');
//   return null;
// };

export default {
  login,
  logout,
  clearCache,
  getTodasManutencoes,
  getManutencoesCaminhao,
  criarManutencao,
  atualizarManutencao,
  deletarManutencao,
  getHistoricoVeiculo,
  getTodosAlertas,
  getAlertasCaminhao,
  criarAlerta,
  getTodosCaminhoes,
  getCaminhaoPorId,
  getCaminhoes,
  getMapas,
  getMapaPorId,
  getCoordenadasCaminhaoRota,
  getRotasCaminhao,
  gerarRelatorioIA,
  checkApiStatus,
  getApiStatus,
  resetarEstadoAPI,
  forcarModoOffline,
  tentarReconectar,
  testarEndpoints,
  getManutencoesMarcadas,
  getManutencoesConcluidas,
  calcularGastoTotal,
  formatarData,
  formatarDataCurta,
  isManutencaoAtrasada,
  agruparGastosPorTipo,
  getVeiculoMaisProblemas,
  getManutencoesMesAtual,
  getEstatisticasFrota
}