/**
 * ============================================================================
 * PROJETO: Protocolo MFMA - Otimização de Rotina e Neuroperformance
 * ARQUIVO: Protocolo-MFMA.js
 * VERSÃO: 3.0 (Circadiana: Múltiplos Turnos Diários)
 * ============================================================================
 */

const CONFIG_MFMA = {
  TASK_LIST_NAME: null,                  // null = varre todas as listas
  SHEET_NAME: null,                      // null = aba ativa
  TAREFAS: [
    {
      titulo: "⚡ Protocolo MFMA: Rotina da Manhã",
      hora: 7, minuto: 0,
      fases_match: ["Fase 1"],
      sos_match: ["Manhã"]
    },
    {
      titulo: "⚡ Protocolo MFMA: Rotina da Tarde",
      hora: 13, minuto: 0,
      fases_match: ["Fase 2"],
      sos_match: ["Tarde"]
    },
    {
      titulo: "⚡ Protocolo MFMA: Rotina da Noite & Sono",
      hora: 20, minuto: 30,
      fases_match: ["Fase 3"],
      sos_match: []
    }
  ]
};

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

function getTasksService() {
  if (typeof Tasks !== 'undefined') return Tasks;
  if (typeof GoogleTasks !== 'undefined') return GoogleTasks;
  throw new Error("Serviço Google Tasks Advanced não encontrado.");
}

function atualizarProtocoloDiario() {
  try {
    Logger.log("[PRODUÇÃO] Iniciando execução diária do Protocolo MFMA (Modo Circadiano)...");
    processarTurnos({ autoCriar: true, testeImediato: false });
  } catch (error) {
    Logger.log(`[ERRO CRÍTICO EM PRODUÇÃO] ${error.message}`);
  }
}

function executarTesteImediatoAgora() {
  try {
    Logger.log("[TESTE IMEDIATO] Executando teste (tarefas para os próximos 2, 4 e 6 minutos)...");
    processarTurnos({ autoCriar: true, testeImediato: true });
  } catch (error) {
    Logger.log(`[ERRO NO TESTE IMEDIATO] ${error.message}`);
  }
}

function processarTurnos(opcoes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Nenhuma planilha vinculada encontrada.");

  const sheet = CONFIG_MFMA.SHEET_NAME ? ss.getSheetByName(CONFIG_MFMA.SHEET_NAME) : ss.getActiveSheet();
  if (!sheet) throw new Error("Aba não encontrada.");

  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) throw new Error("A planilha de protocolos está vazia.");

  const protocolos = [];
  
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0]) continue;
    protocolos.push({
      id: linha[0],
      faseModulo: String(linha[1] || "").trim(),
      horarioJanela: String(linha[2] || "").trim(),
      categoria: String(linha[3] || "").trim(),
      protocolo: String(linha[4] || "").trim(),
      objetivo: String(linha[5] || "").trim(),
      instrucoes: String(linha[6] || "").trim(),
      dicas: String(linha[7] || "").trim()
    });
  }

  const tasksService = getTasksService();

  CONFIG_MFMA.TAREFAS.forEach((tarefaConfig, index) => {
    const itensFase = protocolos.filter(p => tarefaConfig.fases_match.some(fm => p.faseModulo.includes(fm)));
    const itensSOS = protocolos.filter(p => p.faseModulo.includes("SOS") && tarefaConfig.sos_match.some(sm => p.horarioJanela.includes(sm)));

    if (itensFase.length === 0) return;

    let textoNotas = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    itensFase.forEach(item => {
      const emoji = EMOJIS_CATEGORIA[item.categoria] || "⚡";
      textoNotas += `${emoji} [${item.horarioJanela}] ${item.protocolo}\n`;
      textoNotas += `   ↳ ${item.instrucoes.replace(/\n/g, '\n   ')}\n\n`;
    });

    if (itensSOS.length > 0) {
      textoNotas += `⚠️ SOS Recuperação (se dormiu mal):\n`;
      itensSOS.forEach(item => {
        const emoji = EMOJIS_CATEGORIA[item.categoria] || "🔋";
        textoNotas += `${emoji} [${item.horarioJanela}] ${item.protocolo}\n`;
        textoNotas += `   ↳ ${item.instrucoes.replace(/\n/g, '\n   ')}\n\n`;
      });
    }
    textoNotas += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🧠 Otimização diária baseada em neurociência e ritmo circadiano.`;

    let dataVencimento;
    if (opcoes.testeImediato) {
      dataVencimento = new Date(Date.now() + (index + 1) * 2 * 60 * 1000);
    } else {
      dataVencimento = new Date();
      dataVencimento.setHours(tarefaConfig.hora, tarefaConfig.minuto, 0, 0);
    }

    const resultadoBusca = localizarTarefaEmTodasAsListas(tasksService, tarefaConfig.titulo, CONFIG_MFMA.TASK_LIST_NAME);

    if (resultadoBusca) {
      const { taskListId, task } = resultadoBusca;
      task.title = tarefaConfig.titulo;
      task.notes = textoNotas;
      task.status = "needsAction";
      task.completed = null;
      task.due = dataVencimento.toISOString();

      tasksService.Tasks.patch(task, taskListId, task.id);
      Logger.log(`[SUCESSO] Tarefa "${task.title}" atualizada para vencimento: ${dataVencimento.toLocaleTimeString('pt-BR')}!`);
    } else if (opcoes.autoCriar) {
      const payloadNovaTarefa = {
        title: tarefaConfig.titulo,
        notes: textoNotas,
        due: dataVencimento.toISOString(),
        status: "needsAction"
      };

      const listaDestino = CONFIG_MFMA.TASK_LIST_NAME || "@default";
      tasksService.Tasks.insert(payloadNovaTarefa, listaDestino);
      Logger.log(`[CRIADA] Tarefa "${tarefaConfig.titulo}" criada na lista destino.`);
    }
  });
}

function localizarTarefaEmTodasAsListas(tasksService, tituloExato, nomeListaEspecifica) {
  const termo = normalizarTexto(tituloExato);
  let listas = [];
  let pageTokenListas = null;
  do {
    const resp = tasksService.Tasklists.list({ maxResults: 100, pageToken: pageTokenListas });
    if (resp.items) listas = listas.concat(resp.items);
    pageTokenListas = resp.nextPageToken;
  } while (pageTokenListas);

  if (!listas.length) return null;

  let listasAlvo = listas;
  if (nomeListaEspecifica) {
    const nomeNorm = normalizarTexto(nomeListaEspecifica);
    listasAlvo = listas.filter(l => normalizarTexto(l.title) === nomeNorm);
    if (!listasAlvo.length) listasAlvo = listas;
  }

  for (const lista of listasAlvo) {
    let pageTokenTarefas = null;
    do {
      const respTarefas = tasksService.Tasks.list(lista.id, {
        maxResults: 100, showCompleted: true, showHidden: true, pageToken: pageTokenTarefas
      });
      if (respTarefas.items) {
        for (const tarefa of respTarefas.items) {
          if (tarefa.title && normalizarTexto(tarefa.title) === termo) {
            return { taskListId: lista.id, taskListName: lista.title, task: tarefa };
          }
        }
      }
      pageTokenTarefas = respTarefas.nextPageToken;
    } while (pageTokenTarefas);
  }
  return null;
}

function normalizarTexto(texto) {
  if (!texto) return "";
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}