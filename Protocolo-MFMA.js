/**
 * ============================================================================
 * PROJETO: Protocolo MFMA - Otimização de Rotina e Neuroperformance
 * ARQUIVO: Protocolo-MFMA.js
 * VERSÃO: 2.0 (Resiliência Total com Auto-Alinhamento de Vencimento 'due')
 * ============================================================================
 */

/**
 * Configurações Globais Parametrizáveis
 */
const CONFIG_MFMA = {
  TASK_TITLE_KEYWORD: "Protocolo MFMA",  // Palavra-chave identificadora no título
  TASK_LIST_NAME: null,                  // null = varre todas as listas
  SHEET_NAME: null,                      // null = aba ativa
  PROP_KEY_FASE_ATUAL: "FASE_MFMA_ATUAL",// Chave do contador sequencial
  HORA_VENCIMENTO_PADRAO: 7,             // 07:00 da manhã
  MINUTO_VENCIMENTO_PADRAO: 0
};

/**
 * Emojis temáticos por categoria
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
 * Retorna o serviço Tasks com suporte a fallback
 */
function getTasksService() {
  if (typeof Tasks !== 'undefined') {
    return Tasks;
  } else if (typeof GoogleTasks !== 'undefined') {
    return GoogleTasks;
  } else {
    throw new Error(
      "Serviço Google Tasks Advanced não encontrado. Adicione o serviço 'Tasks API' em Serviços (Services) no painel esquerdo."
    );
  }
}

/**
 * ============================================================================
 * FUNÇÃO DE PRODUÇÃO (TRIGGER MATINAL DIÁRIO)
 * ============================================================================
 * Executa todas as madrugadas via acionador de tempo (04:00 às 06:00).
 */
function atualizarProtocoloDiario() {
  try {
    Logger.log("[PRODUÇÃO] Iniciando execução diária do Protocolo MFMA...");
    const atualizadoComSucesso = processarAtualizacaoProtocolo({
      autoCriar: true,
      avancarContador: true
    });

    if (!atualizadoComSucesso) {
      Logger.log("[AVISO] Falha ao processar atualização diária.");
    }
  } catch (error) {
    Logger.log(`[ERRO CRÍTICO EM PRODUÇÃO] ${error.message}`);
    if (error.stack) Logger.log(`Stack Trace: ${error.stack}`);
  }
}

/**
 * ============================================================================
 * MODO DE TESTE IMEDIATO (+2 MINUTOS)
 * ============================================================================
 * Testa push notification no celular sem avançar o contador do cronograma.
 */
function executarTesteImediatoAgora() {
  try {
    Logger.log("[TESTE IMEDIATO] Executando teste do Protocolo MFMA com auto-criação ativa (sem avançar contador)...");
    processarAtualizacaoProtocolo({
      autoCriar: true,
      avancarContador: false,
      testeImediato2Min: true
    });
  } catch (error) {
    Logger.log(`[ERRO NO TESTE IMEDIATO] ${error.message}`);
    if (error.stack) Logger.log(`Stack Trace: ${error.stack}`);
  }
}

/**
 * Injeta um ID específico para teste sem alterar o contador.
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
 * Orquestrador principal com alinhamento rigoroso de data e reativação.
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

  // 1. Obter ID do protocolo
  const props = PropertiesService.getScriptProperties();
  let idAtual = opcoes.idForcado 
    ? opcoes.idForcado 
    : parseInt(props.getProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL) || "1", 10);

  const totalProtocolos = dados.length - 1;
  if (idAtual > totalProtocolos || idAtual < 1) {
    Logger.log(`[CICLO REINICIADO] Ponteiro (${idAtual}) fora dos limites (1-${totalProtocolos}). Reiniciando no ID 1.`);
    idAtual = 1;
  }

  // 2. Localizar registro correspondente
  let linhaProtocolo = null;
  for (let i = 1; i < dados.length; i++) {
    const rowId = parseInt(dados[i][0], 10);
    if (rowId === idAtual) {
      linhaProtocolo = dados[i];
      break;
    }
  }

  if (!linhaProtocolo) {
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

  // 3. Montar títulos e notas
  const notasFormatadas = formatarNotaProtocolo(itemProtocolo, totalProtocolos);
  const tituloDinamico = `⚡ ${CONFIG_MFMA.TASK_TITLE_KEYWORD}: ${itemProtocolo.protocolo}`;

  // 4. Calcular data de vencimento (due) exata para evitar tarefas atrasadas ("Há X dias")
  let dataVencimento;
  if (opcoes.testeImediato2Min) {
    dataVencimento = new Date(Date.now() + 2 * 60 * 1000); // +2 minutos
  } else {
    dataVencimento = new Date();
    dataVencimento.setHours(CONFIG_MFMA.HORA_VENCIMENTO_PADRAO, CONFIG_MFMA.MINUTO_VENCIMENTO_PADRAO, 0, 0);
  }

  // 5. Localizar tarefa existente
  const tasksService = getTasksService();
  const resultadoBusca = localizarTarefaEmTodasAsListas(tasksService, CONFIG_MFMA.TASK_TITLE_KEYWORD, CONFIG_MFMA.TASK_LIST_NAME);

  if (resultadoBusca) {
    const { taskListId, taskListName, task } = resultadoBusca;
    
    // Atualização completa
    task.title = tituloDinamico;
    task.notes = notasFormatadas;
    task.status = "needsAction";
    task.completed = null;
    task.due = dataVencimento.toISOString(); // Atualiza a data para HOJE

    tasksService.Tasks.patch(task, taskListId, task.id);
    Logger.log(`[SUCESSO] Tarefa "${task.title}" (ID: ${task.id}) na lista "${taskListName}" atualizada para Protocolo #${itemProtocolo.id} com vencimento alinhado para ${dataVencimento.toLocaleTimeString('pt-BR')}!`);

    if (opcoes.avancarContador) {
      const proximoId = (idAtual % totalProtocolos) + 1;
      props.setProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL, String(proximoId));
      Logger.log(`[ESTADO ATUALIZADO] Próximo protocolo agendado: #${proximoId}`);
    }

    return true;
  } else {
    if (opcoes.autoCriar) {
      const payloadNovaTarefa = {
        title: tituloDinamico,
        notes: notasFormatadas,
        due: dataVencimento.toISOString(),
        status: "needsAction"
      };

      const listaDestino = CONFIG_MFMA.TASK_LIST_NAME || "@default";
      const tarefaCriada = tasksService.Tasks.insert(payloadNovaTarefa, listaDestino);
      
      Logger.log(`[AUTO-CRIAÇÃO REALIZADA] Tarefa criada com sucesso na lista "${listaDestino}" (ID: ${tarefaCriada.id})!`);
      
      if (opcoes.avancarContador) {
        const proximoId = (idAtual % totalProtocolos) + 1;
        props.setProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL, String(proximoId));
      }
      return true;
    }
    
    Logger.log(`[NÃO ENCONTRADA] Nenhuma tarefa contendo "${CONFIG_MFMA.TASK_TITLE_KEYWORD}" foi localizada.`);
    return false;
  }
}

/**
 * Layout enriquecido para as notas da tarefa
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
 * Busca resiliente multilista
 */
function localizarTarefaEmTodasAsListas(tasksService, palavraChave, nomeListaEspecifica) {
  const termoNormalizado = normalizarTexto(palavraChave);
  
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
    return null;
  }

  let listasAlvo = listas;
  if (nomeListaEspecifica) {
    const nomeNorm = normalizarTexto(nomeListaEspecifica);
    listasAlvo = listas.filter(l => normalizarTexto(l.title) === nomeNorm);
    if (listasAlvo.length === 0) listasAlvo = listas;
  }

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
 * Normalização Unicode
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
 * MANUTENÇÃO MANUAL DO CRONOGRAMA
 * ============================================================================
 */
function definirFaseManual(numero) {
  const num = parseInt(numero || 5, 10);
  PropertiesService.getScriptProperties().setProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL, String(num));
  Logger.log(`[MANUTENÇÃO] Ponteiro do Protocolo MFMA ajustado manualmente para #${num}.`);
}

function definirFaseInicial() {
  definirFaseManual(1);
}

function exibirStatusAtual() {
  const idAtual = PropertiesService.getScriptProperties().getProperty(CONFIG_MFMA.PROP_KEY_FASE_ATUAL) || "1";
  Logger.log(`[STATUS DO CRONOGRAMA] Próximo Protocolo a ser executado: #${idAtual}`);
}