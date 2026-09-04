/**
 * ============================================================================
 * PROJETO: Protocolo MFMA - Otimização de Rotina e Neuroperformance
 * ARQUIVO: Protocolo-MFMA.js
 * FINALIDADE: Atualização perpétua e automatizada das diretrizes e protocolos
 *             do MFMA nas notas da tarefa diária do Google Tasks.
 * 
 * PADRÃO ARQUITETURAL:
 *  - CONFIG_MFMA centralizado e parametrizável
 *  - Suporte a Tasks API com tratamento de fallback ('Tasks' e 'GoogleTasks')
 *  - Normalização Unicode NFD ('normalizarTexto') imune a acentos e formatações mobile
 *  - Busca resiliente multilista com paginação ('nextPageToken')
 *  - Flags 'showCompleted: true' e 'showHidden: true' (localiza mesmo arquivadas)
 *  - Reativação automática com 'status: "needsAction"' e 'completed: null'
 *  - Disparo oficial diário via trigger matinal com avanço sequencial seguro
 *  - Modo de teste imediato com auto-criação e vencimento em +2 min (sem avançar cronograma)
 *  - Funções de manutenção manual (definirFaseManual e definirFaseInicial)
 * ============================================================================
 */

/**
 * Configurações Globais Parametrizáveis
 */
const CONFIG_MFMA = {
  TASK_TITLE_KEYWORD: "Protocolo MFMA", // Palavra-chave contida no título da tarefa
  TASK_LIST_NAME: null,                 // Deixe null para varrer TODAS as listas ou defina o nome exato (ex: "Meu Dia")
  SHEET_NAME: null,                     // Deixe null para usar a aba ativa ou especifique ex: "Protocolo-MFMA"
  PROP_KEY_FASE_ATUAL: "FASE_MFMA_ATUAL" // Chave de persistência de estado no PropertiesService
};

/**
 * Mapeamento de emojis temáticos por categoria/módulo
 */
const EMOJIS_CATEGORIA = {
  "Despertar & Respiração": "🫁",
  "Cardio & Termogênese": "🏃‍♂️",
  "Termogênese & Alerta": "🧊",
  "Nutrição Estratégica": "🍳",
  "Neuroperformance": "☕",
  "Produtividade & Ergonomia": "🎯",
  "Treino & Condicionamento": "💪",
  "Nutrição & Digestão": "🥗",
  "Recuperação Neural": "🧠",
  "Foco Imersivo & Neuroacústica": "🎧",
  "Ritmo Circadiano & Movimento": "🌅",
  "Higiene do Sono & Melatonina": "🌙",
  "Desaceleração Neural": "🌬️",
  "Arquitetura Circadiana": "⏰",
  "Reset Circadiano de Emergência": "☀️",
  "Recuperação Cerebral de Emergência": "🔋"
};

/**
 * Obtém a referência do serviço Google Tasks com suporte a fallback de identificadores
 * @returns {Object} Serviço Tasks ativo
 */
function getTasksService() {
  if (typeof Tasks !== 'undefined') {
    return Tasks;
  } else if (typeof GoogleTasks !== 'undefined') {
    return GoogleTasks;
  } else {
    throw new Error(
      "Serviço Google Tasks Advanced não encontrado. Adicione o serviço 'Tasks API' em Serviços (Services) no painel esquerdo do Google Apps Script."
    );
  }
}

/**
 * ============================================================================
 * FUNÇÃO DE PRODUÇÃO (TRIGGER MATINAL DIÁRIO)
 * ============================================================================
 * Executa automaticamente todas as madrugadas (idealmente entre 04:00 e 06:00).
 * Lê o protocolo sequencial atual, atualiza a tarefa no Google Tasks e avança o contador.
 */
function atualizarProtocoloDiario() {
  try {
    Logger.log("[PRODUÇÃO] Iniciando execução diária do Protocolo MFMA...");
    const atualizadoComSucesso = processarAtualizacaoProtocolo({
      autoCriar: false,
      avancarContador: true
    });

    if (!atualizadoComSucesso) {
      Logger.log("[AVISO] A tarefa não pôde ser atualizada. O ponteiro de fase foi mantido para nova tentativa.");
    }
  } catch (error) {
    Logger.log(`[ERRO CRÍTICO EM PRODUÇÃO] ${error.message}`);
    if (error.stack) Logger.log(`Stack Trace: ${error.stack}`);
  }
}

/**
 * ============================================================================
 * MODO DE TESTE IMEDIATO (COM AUTO-CRIAÇÃO E ALERTA EM +2 MIN)
 * ============================================================================
 * - Se a tarefa não existir, cria automaticamente na lista padrão (@default)
 *   com horário de vencimento em +2 minutos para testar a notificação push.
 * - Atualiza as notas com o protocolo corrente.
 * - NÃO altera o contador sequencial (permite testar à vontade sem avançar o cronograma).
 */
function executarTesteImediatoAgora() {
  try {
    Logger.log("[TESTE IMEDIATO] Executando teste do Protocolo MFMA com auto-criação ativa (sem avançar contador)...");
    processarAtualizacaoProtocolo({
      autoCriar: true,
      avancarContador: false
    });
  } catch (error) {
    Logger.log(`[ERRO NO TESTE IMEDIATO] ${error.message}`);
    if (error.stack) Logger.log(`Stack Trace: ${error.stack}`);
  }
}

/**
 * ============================================================================
 * TESTE ESPECÍFICO DE UM PROTOCOLO / ID
 * ============================================================================
 * Injeta na tarefa as diretrizes de um ID específico (ex: ID 1 ou ID 9) para conferência,
 * sem alterar o ponteiro do cronograma.
 * Exemplo de uso: testarProtocoloEspecifico(9)
 * 
 * @param {number|string} idProtocolo - Número do ID da planilha a ser testado
 */
function testarProtocoloEspecifico(idProtocolo) {
  const idAlvo = parseInt(idProtocolo || 1, 10);
  Logger.log(`[TESTE MANUAL] Simulando injeção do Protocolo ID ${idAlvo}...`);
  
  processarAtualizacaoProtocolo({
    autoCriar: false,
    avancarContador: false,
    idForcado: idAlvo
  });
}

/**
 * Orquestrador principal da leitura do Sheets, montagem do payload e injeção na Tasks API.
 * 
 * @param {Object} opcoes - { autoCriar: boolean, avancarContador: boolean, idForcado: number|null }
 * @returns {boolean} true se atualizado/criado com sucesso
 */
function processarAtualizacaoProtocolo(opcoes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Nenhuma planilha vinculada encontrada. Execute o script a partir do Google Sheets.");
  }

  const sheet = CONFIG_MFMA.SHEET_NAME 
    ? ss.getSheetByName(CONFIG_MFMA.SHEET_NAME) 
    : ss.getActiveSheet();

  if (!sheet) {
    throw new Error(`Aba não encontrada: ${CONFIG_MFMA.SHEET_NAME || 'Aba Ativa'}`);
  }

  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) {
    throw new Error("A planilha de protocolos está vazia ou possui apenas o cabeçalho.");
  }

  // 1. Obter ID do protocolo a ser processado
  const props = PropertiesService.getScriptProperties();
  let idAtual = opcoes.idForcado 
    ? opcoes.idForcado 
    : parseInt(props.getProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL) || "1", 10);

  const totalProtocolos = dados.length - 1; // Desconsiderando cabeçalho
  if (idAtual > totalProtocolos || idAtual < 1) {
    Logger.log(`[CICLO REINICIADO] Ponteiro (${idAtual}) excedeu total (${totalProtocolos}). Reiniciando no ID 1.`);
    idAtual = 1;
  }

  // 2. Localizar a linha correspondente ao ID na planilha
  // Colunas esperadas: ID, Fase_Modulo, Horario_Janela, Categoria, Protocolo, Objetivo_Beneficio, Instrucoes_Acao, Dicas_Cuidados
  let linhaProtocolo = null;
  for (let i = 1; i < dados.length; i++) {
    const rowId = parseInt(dados[i][0], 10);
    if (rowId === idAtual) {
      linhaProtocolo = dados[i];
      break;
    }
  }

  if (!linhaProtocolo) {
    // Fallback para índice direto caso IDs não sejam sequenciais
    const indiceFallback = ((idAtual - 1) % totalProtocolos) + 1;
    linhaProtocolo = dados[indiceFallback];
  }

  const itemProtocolo = {
    id: linhaProtocolo[0],
    faseModulo: String(linhaProtocolo[1] || "").trim(),
    horarioJanela: String(linhaProtocolo[2] || "").trim(),
    categoria: String(linhaProtocolo[3] || "").trim(),
    protocolo: String(linhaProtocolo[4] || "").trim(),
    objetivo: String(linhaProtocolo[5] || "").trim(),
    instrucoes: String(linhaProtocolo[6] || "").trim(),
    dicas: String(linhaProtocolo[7] || "").trim()
  };

  Logger.log(`[PROTOCOLO CARREGADO] ID ${itemProtocolo.id}: "${itemProtocolo.protocolo}" (${itemProtocolo.faseModulo})`);

  // 3. Montar o texto formatado para as notas da tarefa
  const notasFormatadas = formatarNotaProtocolo(itemProtocolo, totalProtocolos);

  // 4. Localizar a tarefa em TODAS as listas do usuário
  const tasksService = getTasksService();
  const resultadoBusca = localizarTarefaEmTodasAsListas(tasksService, CONFIG_MFMA.TASK_TITLE_KEYWORD, CONFIG_MFMA.TASK_LIST_NAME);

  if (resultadoBusca) {
    const { taskListId, taskListName, task } = resultadoBusca;
    
    task.notes = notasFormatadas;
    task.status = "needsAction";
    task.completed = null;

    tasksService.Tasks.patch(task, taskListId, task.id);
    Logger.log(`[SUCESSO] Tarefa "${task.title}" (ID: ${task.id}) na lista "${taskListName}" atualizada para Protocolo #${itemProtocolo.id}!`);

    if (opcoes.avancarContador) {
      const proximoId = (idAtual % totalProtocolos) + 1;
      props.setProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL, String(proximoId));
      Logger.log(`[ESTADO ATUALIZADO] Próximo protocolo agendado: #${proximoId}`);
    }

    return true;
  } else {
    Logger.log(`[NÃO ENCONTRADA] Nenhuma tarefa contendo "${CONFIG_MFMA.TASK_TITLE_KEYWORD}" foi localizada.`);
    
    if (opcoes.autoCriar) {
      const dataVencimento = new Date(Date.now() + 2 * 60 * 1000); // Daqui a 2 minutos
      const payloadNovaTarefa = {
        title: `⚡ ${CONFIG_MFMA.TASK_TITLE_KEYWORD}: ${itemProtocolo.protocolo}`,
        notes: notasFormatadas,
        due: dataVencimento.toISOString(),
        status: "needsAction"
      };

      const listaDestino = CONFIG_MFMA.TASK_LIST_NAME || "@default";
      const tarefaCriada = tasksService.Tasks.insert(payloadNovaTarefa, listaDestino);
      
      Logger.log(`[AUTO-CRIAÇÃO REALIZADA] Tarefa criada com sucesso na lista "${listaDestino}"!`);
      Logger.log(`ID: ${tarefaCriada.id} | Vencimento configurado para: ${dataVencimento.toLocaleTimeString('pt-BR')} (+2 min para teste imediato de notificação push)`);
      return true;
    }
    
    return false;
  }
}

/**
 * Formata os detalhes do protocolo em um layout limpo, escaneável e rico em emojis para o Google Tasks
 * 
 * @param {Object} item - Objeto com dados do protocolo
 * @param {number} totalProtocolos - Total de protocolos no cronograma
 * @returns {string} Texto estruturado pronto para a propriedade notes
 */
function formatarNotaProtocolo(item, totalProtocolos) {
  const emoji = EMOJIS_CATEGORIA[item.categoria] || "⚡";

  let texto = `${emoji} PROTOCOLO MFMA | MÓDULO #${item.id} de ${totalProtocolos}\n`;
  texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  texto += `📌 FASE / MÓDULO: ${item.faseModulo}\n`;
  if (item.horarioJanela) {
    texto += `⏰ JANELA HORÁRIA: ${item.horarioJanela}\n`;
  }
  texto += `🏷️ CATEGORIA: ${item.categoria}\n`;
  texto += `🎯 DIRETRIZ: ${item.protocolo}\n\n`;

  if (item.objetivo) {
    texto += `💡 OBJETIVO & IMPACTO BIOLÓGICO:\n${item.objetivo}\n\n`;
  }

  if (item.instrucoes) {
    texto += `📋 AÇÃO RECOMENDADA / PASSO A PASSO:\n${item.instrucoes}\n\n`;
  }

  if (item.dicas) {
    texto += `⚠️ ATENÇÃO & DICAS PRÁTICAS:\n${item.dicas}\n\n`;
  }

  texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `🧠 Otimização diária baseada em neurociência e ritmo circadiano.`;

  return texto;
}

/**
 * Varre com resiliência as listas de tarefas com suporte a paginação e normalização Unicode
 * 
 * @param {Object} tasksService - Instância da Tasks API
 * @param {string} palavraChave - Palavra a ser buscada no título da tarefa
 * @param {string|null} nomeListaEspecifica - Nome exato da lista ou null para todas
 * @returns {Object|null} Objeto com { taskListId, taskListName, task } ou null
 */
function localizarTarefaEmTodasAsListas(tasksService, palavraChave, nomeListaEspecifica) {
  const termoNormalizado = normalizarTexto(palavraChave);
  
  // 1. Obter todas as listas
  let listas = [];
  let pageTokenListas = null;
  do {
    const resp = tasksService.Tasklists.list({
      maxResults: 100,
      pageToken: pageTokenListas
    });
    if (resp.items && resp.items.length > 0) {
      listas = listas.concat(resp.items);
    }
    pageTokenListas = resp.nextPageToken;
  } while (pageTokenListas);

  if (!listas || listas.length === 0) {
    Logger.log("[AVISO] Nenhuma lista de tarefas encontrada na conta.");
    return null;
  }

  // Filtrar se especificado nome da lista
  let listasAlvo = listas;
  if (nomeListaEspecifica) {
    const nomeNorm = normalizarTexto(nomeListaEspecifica);
    listasAlvo = listas.filter(l => normalizarTexto(l.title) === nomeNorm);
    if (listasAlvo.length === 0) {
      Logger.log(`[AVISO] Lista especificada "${nomeListaEspecifica}" não encontrada. Varreremos todas as listas.`);
      listasAlvo = listas;
    }
  }

  // 2. Varrer as tarefas de cada lista
  for (const lista of listasAlvo) {
    let pageTokenTarefas = null;
    do {
      const respTarefas = tasksService.Tasks.list(lista.id, {
        maxResults: 100,
        showCompleted: true,
        showHidden: true,
        pageToken: pageTokenTarefas
      });

      if (respTarefas.items && respTarefas.items.length > 0) {
        for (const tarefa of respTarefas.items) {
          if (!tarefa.title) continue;
          
          const tituloNormalizado = normalizarTexto(tarefa.title);
          if (tituloNormalizado.includes(termoNormalizado)) {
            Logger.log(`[ENCONTRADA] Tarefa "${tarefa.title}" localizada na lista "${lista.title}".`);
            return {
              taskListId: lista.id,
              taskListName: lista.title,
              task: tarefa
            };
          }
        }
      }
      pageTokenTarefas = respTarefas.nextPageToken;
    } while (pageTokenTarefas);
  }

  return null;
}

/**
 * Remove acentos, caracteres diacríticos e formatações móveis para comparação segura
 * @param {string} texto - Texto original
 * @returns {string} Texto minúsculo e sem acentos
 */
function normalizarTexto(texto) {
  if (!texto) return "";
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * ============================================================================
 * FUNÇÕES DE MANUTENÇÃO MANUAL DO CRONOGRAMA
 * ============================================================================
 */

/**
 * Define manualmente o próximo protocolo a ser executado
 * Exemplo: definirFaseManual(5)
 * @param {number} numero - Número do protocolo (ID)
 */
function definirFaseManual(numero) {
  const num = parseInt(numero, 10);
  if (isNaN(num) || num < 1) {
    Logger.log("[ERRO] Informe um número inteiro válido maior ou igual a 1.");
    return;
  }
  PropertiesService.getScriptProperties().setProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL, String(num));
  Logger.log(`[MANUTENÇÃO] Ponteiro do Protocolo MFMA ajustado manualmente para #${num}.`);
}

/**
 * Reseta o ponteiro do cronograma para o primeiro protocolo (ID 1)
 */
function definirFaseInicial() {
  definirFaseManual(1);
}

/**
 * Exibe no Logger o status atual do ponteiro do cronograma
 */
function exibirStatusAtual() {
  const idAtual = PropertiesService.getScriptProperties().getProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL) || "1";
  Logger.log(`[STATUS DO CRONOGRAMA] Próximo Protocolo a ser executado: #${idAtual}`);
}
