# ⚡ Protocolo MFMA: Otimização Diária de Rotina & Neuroperformance (Google Tasks)

Sistema de automação e injeção contínua de diretrizes de neurociência, ritmo circadiano, biohacking e produtividade do **Protocolo MFMA** diretamente no **Google Tarefas (Google Tasks)**, integrado a uma planilha de controle no **Google Sheets**.

---

## 🎯 Visão Geral do Projeto

O **Protocolo MFMA** é um manual prático baseado em evidências científicas que estrutura a rotina diária em três fases complementares e protocolos emergenciais:
1. **Fase 1 (Manhã):** Despertar, ativação dopaminérgica, respiração, termogênese e nutrição proteica.
2. **Fase 2 (Tarde e Início da Noite):** Sustentação de energia, treino de alta densidade, NSDR (*Non-Sleep Deep Rest*) e blocos de *Deep Work* com ondas binaurais (40 Hz).
3. **Fase 3 (Noite):** Desaceleração neural, higiene do sono, modulação de iluminação e suspiro fisiológico para sono restaurador.
4. **SOS Recuperação:** Protocolo de reset circadiano e mitigações para noites mal dormidas.

Este projeto extrai o conteúdo integral do manual confidencial, estrutura as diretrizes em um dataset padronizado (`Protocolo-MFMA.csv`) e automatiza a atualização diária das notas de uma tarefa fixa no Google Tasks.

---

## 📁 Estrutura do Repositório

```text
Protocolo-MFMA/
├── Manual-de-Bolso-MFMA.pdf   # Documento PDF fonte original
├── Protocolo-MFMA.csv         # Dataset consolidado e estruturado (UTF-8)
├── Protocolo-MFMA.js          # Script Google Apps Script com arquitetura de resiliência
├── requirements.txt           # Dependências Python para extração de dados
└── README.md                  # Manual de documentação e implantação
```

---

## 📊 Estrutura do Dataset (`Protocolo-MFMA.csv`)

O arquivo CSV foi consolidado com 16 módulos estruturados em 8 colunas:

| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **`ID`** | Identificador sequencial do protocolo (1 a 16). | `1` |
| **`Fase_Modulo`** | Fase da rotina ou módulo específico. | `Fase 1 (Manhã)` |
| **`Horario_Janela`** | Janela horária ideal para execução. | `Ao acordar (Primeiras horas)` |
| **`Categoria`** | Eixo funcional do protocolo. | `Despertar & Respiração` |
| **`Protocolo`** | Nome da técnica ou diretriz. | `Respiração Wim Hof` |
| **`Objetivo_Beneficio`** | Justificativa biológica e impacto neurofuncional. | `Oxigenação profunda e aumento de foco.` |
| **`Instrucoes_Acao`** | Passo a passo operacional detalhado. | `1. 30 respirações rápidas... 2. Apneia...` |
| **`Dicas_Cuidados`** | Recomendações de segurança e otimizações práticas. | `Nunca realizar na água ou dirigindo.` |

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
3. Se você ainda não possuir uma tarefa criada, o script **criará automaticamente** a tarefa no Google Tarefas com vencimento para **+2 minutos**, permitindo validar o disparo de notificação push no seu celular ou desktop imediatamente.

### Passo 5: Configurar o Trigger Diário Automático
1. Na barra lateral esquerda do Apps Script, clique no ícone de relógio (**Acionadores** / *Triggers*).
2. Clique em **+ Adicionar acionador** (canto inferior direito).
3. Configure:
   - **Função a ser executada:** `atualizarProtocoloDiario`
   - **Implantação:** `Head`
   - **Origem do evento:** `Baseado no tempo`
   - **Tipo de acionador:** `Temporizador diário`
   - **Hora do dia:** `Das 04:00 às 05:00` (ou o horário de sua preferência antes do despertar)
4. Clique em **Salvar**.

---

## 🛠️ Funções Utilitárias & Manutenção Manual

O script dispõe de funções prontas para gerenciamento manual:

- **`executarTesteImediatoAgora()`**: Dispara o teste imediato com auto-criação de tarefa sem consumir/avançar o cronograma sequencial.
- **`testarProtocoloEspecifico(numeroId)`**: Injeta instantaneamente um protocolo específico (ex: `testarProtocoloEspecifico(9)` para testar a diretriz de *NSDR*).
- **`definirFaseManual(numeroId)`**: Ajusta o ponteiro da próxima execução para um ID desejado (ex: `definirFaseManual(1)`).
- **`definirFaseInicial()`**: Reseta o ponteiro de execução para o Protocolo #1.
- **`exibirStatusAtual()`**: Registra no log de execução o ID do próximo protocolo a ser processado.

---

## 🛡️ Robustez & Resiliência Arquitetural

- **Busca Multilista com Paginação:** Percorre todas as listas de tarefas da conta utilizando `nextPageToken`.
- **Flags `showCompleted` e `showHidden`:** Localiza a tarefa mesmo se o usuário tiver marcado como concluída ou se ela estiver oculta.
- **Reativação Automática:** Ao atualizar as notas, redefine `status: "needsAction"` e `completed: null`, recolocando a tarefa ativa na lista diária.
- **Normalização Unicode NFD:** Comparação resiliente de títulos imune a acentos, caixas alta/baixa ou formatações móveis.
- **Fallback de Identificadores:** Compatibilidade garantida tanto para `Tasks` quanto `GoogleTasks`.
