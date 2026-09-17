# ⚡ Protocolo MFMA: Otimização Diária de Rotina & Neuroperformance (Google Tasks)

Sistema de automação e injeção contínua de diretrizes de neurociência, ritmo circadiano, biohacking e produtividade do **Protocolo MFMA** diretamente no **Google Tarefas (Google Tasks)**, integrado a uma planilha de controle no **Google Sheets**.

---

## 🎯 Visão Geral do Projeto

O **Protocolo MFMA** é um manual prático baseado em evidências científicas que estrutura a rotina diária em três fases complementares e protocolos emergenciais:
1. **Fase 1 (Manhã):** Despertar, ativação dopaminérgica, respiração, termogênese e nutrição proteica.
2. **Fase 2 (Tarde e Início da Noite):** Sustentação de energia, treino de alta densidade, NSDR (*Non-Sleep Deep Rest*) e blocos de *Deep Work* com ondas binaurais (40 Hz).
3. **Fase 3 (Noite):** Desaceleração neural, higiene do sono, modulação de iluminação e suspiro fisiológico para sono restaurador.
4. **SOS Recuperação:** Protocolo de reset circadiano e mitigações para noites mal dormidas.

Este projeto extrai o conteúdo integral do manual, estrutura as diretrizes no dataset `Protocolo-MFMA.csv` e automatiza a atualização de **3 Tarefas Diárias por Turno** no Google Tasks, refletindo fielmente a rotina circadiana.

---

## 🏗️ Arquitetura da Automação (Opção A - 3 Tarefas Diárias)

Em vez de um cronograma linear (1 ID por dia ao longo de 16 dias), o script foi rearquitetado para gerenciar diariamente **3 tarefas simultâneas**, cobrindo o dia inteiro do usuário:

1. **⚡ Protocolo MFMA: Rotina da Manhã**
   - **Vencimento:** 07:00 de HOJE.
   - **Notas:** Itens consolidados da Fase 1 (Respiração Wim Hof, Cardio, Banho Frio, etc.) e protocolo de SOS matinal (se houver).

2. **⚡ Protocolo MFMA: Rotina da Tarde**
   - **Vencimento:** 13:00 de HOJE.
   - **Notas:** Itens consolidados da Fase 2 (Treino, Almoço, NSDR, Foco Imersivo) e protocolo de SOS de tarde.

3. **⚡ Protocolo MFMA: Rotina da Noite & Sono**
   - **Vencimento:** 20:30 de HOJE.
   - **Notas:** Itens consolidados da Fase 3 (Desaceleração Neural, Higiene do Sono).

---

## 📁 Estrutura do Repositório

```text
Protocolo-MFMA/
├── Manual-de-Bolso-MFMA.pdf   # Documento PDF fonte original
├── Protocolo-MFMA.csv         # Dataset consolidado e estruturado (UTF-8)
├── Protocolo-MFMA.js          # Script Google Apps Script com arquitetura circadiana
├── requirements.txt           # Dependências Python para extração de dados
└── README.md                  # Manual de documentação e implantação
```

---

## 🚀 Guia de Implantação em Produção

### Passo 1: Criar a Planilha no Google Sheets
1. Acesse o [Google Sheets](https://sheets.new) e crie uma nova planilha nomeada como **`Protocolo-MFMA`**.
2. Vá em **Arquivo** > **Importar** > **Fazer upload** e selecione o arquivo [Protocolo-MFMA.csv](Protocolo-MFMA/Protocolo-MFMA.csv).
3. Em *Tipo de importação*, selecione **Substituir planilha atual** (ou criar uma aba chamada `Protocolo-MFMA`).

### Passo 2: Configurar o Google Apps Script
1. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
2. Renomeie o projeto para `Protocolo-MFMA-Automation`.
3. Copie todo o código contido em [Protocolo-MFMA.js](Protocolo-MFMA/Protocolo-MFMA.js) e cole substituindo o conteúdo de `Código.gs`.

### Passo 3: Ativar o Serviço Tasks API (Obrigatório)
1. Na barra lateral esquerda do editor Apps Script, clique no ícone **+** ao lado de **Serviços** (*Services*).
2. Localize **Tasks API** na lista.
3. Certifique-se de que o identificador esteja como `Tasks` e clique em **Adicionar**.

### Passo 4: Validação com Teste Imediato
1. No seletor de funções no topo do Apps Script, selecione `executarTesteImediatoAgora`.
2. Clique em **Executar** e conceda as permissões de autorização da sua conta Google.
3. O script criará as 3 tarefas no seu Google Tasks com alertas imediatos para os próximos **2, 4 e 6 minutos**.

### Passo 5: Configurar o Trigger Diário Automático (Gatilho da Madrugada)
1. Na barra lateral esquerda do Apps Script, clique no ícone de relógio (**Acionadores** / *Triggers*).
2. Clique em **+ Adicionar acionador** (canto inferior direito).
3. Configure:
   - **Função a ser executada:** `atualizarProtocoloDiario`
   - **Implantação:** `Head`
   - **Origem do evento:** `Baseado no tempo`
   - **Tipo de acionador:** `Temporizador diário`
   - **Hora do dia:** `Das 04:00 às 05:00` (Gatilho da madrugada que limpa/atualiza e reativa as tarefas para a data atual)
4. Clique em **Salvar**.

---

## 🛡️ Robustez & Resiliência Arquitetural

- **Busca Multilista com Paginação:** Percorre todas as listas de tarefas da conta utilizando `nextPageToken`.
- **Flags `showCompleted` e `showHidden`:** Localiza as 3 tarefas mesmo se o usuário tiver marcado como concluídas ou se estiverem ocultas, reativando-as diariamente.
- **Reativação Limpa:** Ao atualizar as notas, redefine `status: "needsAction"` e `completed: null`, recolocando as tarefas como pendentes a cada madrugada.
- **Cravação Mandatória da Data:** Redefine o campo `due` diariamente para "HOJE" em formato ISO (07:00, 13:00 e 20:30), prevenindo o acúmulo de atraso de notificações.
