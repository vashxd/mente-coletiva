Game Design Document (GDD): A Mente Coletiva
1. Visão Geral do Produto
Nome do Jogo: A Mente Coletiva (Working Title) Plataforma: Web (Navegador Desktop para Host) + Mobile Web (PWA para Controles) Gênero: Party Game / Social Deduction / Word Game Público Alvo: Grupos de amigos (3 a 10+ jogadores), casual, presencial ou via Discord/Zoom. Hook: "Não tente ser o mais inteligente. Tente ser igual a todo mundo."

2. Regras e Jogabilidade (Core Loop)
2.1 O Objetivo
O objetivo não é acertar a resposta "correta" (como em um quiz), mas sim adivinhar o que a maioria do grupo vai responder. Sincronia mental é a chave.

2.2 Fluxo da Partida
Lobby: Um jogador abre o jogo no PC/TV (Host). O sistema gera um QR Code e um Código de Sala. Os outros jogadores entram pelo celular.

A Pergunta: O Host exibe uma pergunta subjetiva.

Exemplo: "Cite algo que você encontraria no bolso do Batman."

A Resposta: Todos os jogadores digitam uma resposta em seus celulares.

Importante: Eles devem digitar o que acham que os outros vão digitar.

Exemplo: Se você pensar em "Batarangue", mas acha que seus amigos vão escrever "Chaves", escreva "Chaves".

O Agrupamento (Fase de Tensão): O jogo revela as respostas uma a uma. O sistema agrupa respostas idênticas ou muito similares.

Pontuação:

Se sua resposta for única (ninguém mais escreveu): 0 Pontos (Você é a "Ovelha Negra").

Se sua resposta coincidir com X pessoas: X Pontos.

Bônus "Mente Mestra": Se todos os jogadores escreverem a mesma coisa, todos ganham dobro de pontos.

Fim de Jogo: Após 5 ou 10 rodadas (configurável), quem tiver mais pontos vence.

2.3 Mecânicas Especiais (Spice Up)
A Vaca Rosa (Opcional): Inspirado em Herd Mentality. Se um jogador for o único a dar uma resposta "única" na rodada, ele recebe o token da "Vaca Rosa". Enquanto estiver com a Vaca Rosa, ele não pode vencer o jogo, mesmo que tenha mais pontos. Ele só se livra dela se outra pessoa for a única a errar em uma rodada futura.

3. Especificações Técnicas para Desenvolvimento
3.1 Arquitetura (Stack Sugerida)
Frontend (Host & Mobile): React.js (Vite) + TailwindCSS.

Backend (Servidor de Jogo): Node.js + Socket.io (para comunicação Real-Time).

Armazenamento: Em memória (Redis ou variáveis JS simples no servidor) para o estado da sala. Não há necessidade de banco de dados persistente para MVP.

3.2 Lógica de Pontuação e "Fuzzy Matching"
Um dos maiores desafios é quando um jogador digita "Batata" e outro "Batatas". A IA deve implementar uma normalização de texto.

Algoritmo Esperado:

Sanitização: Converter tudo para minúsculas (toLowerCase), remover acentos (normalize), remover espaços extras (trim).

Stemming Simples (Opcional): Remover "s" final para tratar plurais.

Comparação (Levenshtein Distance): Se a distância de edição entre duas palavras for menor que 2 caracteres (para palavras > 4 letras), considerar como iguais.

Ex: "Cenoura" e "Cenouras" -> Match.

Ex: "Pao" e "Pão" -> Match.

3.3 Requisitos PWA (Progressive Web App)
O cliente mobile deve se comportar como um app nativo para evitar que a tela apague enquanto o jogador pensa.

Manifest.json: Configurado para display: standalone (remove a barra de endereço do navegador).

Screen Wake Lock API: Implementar chamada à API navigator.wakeLock para impedir que o celular bloqueie a tela durante a partida.

4. Roadmap de Desenvolvimento (Passo a Passo)
Este roteiro é projetado para você ou uma IA seguir sequencialmente.

Fase 1: O Esqueleto (MVP Técnico)
[ ] Setup do Servidor: Criar servidor Node.js com Express e Socket.io.

[ ] Gerenciador de Salas: Lógica para criar sala (gerar código de 4 letras) e permitir join de jogadores.

[ ] Interface Básica:

Tela Host: Mostra código da sala e lista de jogadores conectados.

Tela Player: Input de nome e botão "Entrar".

[ ] Ping-Pong: Testar se, ao clicar num botão no celular, algo acontece na tela do Host.

Fase 2: O Core Loop (Gameplay)
[ ] Banco de Perguntas: Criar um arquivo JSON com 50 perguntas de teste.

[ ] Estado de Jogo: Implementar máquina de estados no servidor (LOBBY -> QUESTION -> ANSWERING -> REVEAL -> SCORE).

[ ] Input de Resposta: Tela no celular para digitar resposta e enviar.

[ ] Tela de Revelação: O Host deve mostrar as respostas chegando (escondidas) e depois revelar todas.

Fase 3: A Mágica do Texto (Refinamento)
[ ] Algoritmo de Agrupamento: Implementar a lógica de comparação de strings (Fuzzy Matching) descrita no item 3.2.

[ ] Cálculo de Pontos: Atribuir pontos baseados no tamanho dos grupos de resposta.

[ ] Placar: Exibir ranking atualizado após cada rodada.

Fase 4: Polimento e UX (User Experience)
[ ] PWA Features: Adicionar manifest.json e ícones. Implementar Wake Lock.

[ ] Feedback Visual: Animações simples quando uma resposta é revelada ou quando pontos sobem.

[ ] Sound Design: Adicionar sons simples (pop, aplausos, "wah-wah" para erro).

5. Exemplo de JSON de Perguntas (Data Structure)
Para alimentar a IA desenvolvedora, use este formato:

JSON
[
  {
    "id": 1,
    "category": "Comida",
    "text": "Qual é a cobertura de pizza que todo mundo odeia?"
  },
  {
    "id": 2,
    "category": "Cotidiano",
    "text": "Cite algo que você faz logo ao acordar."
  },
  {
    "id": 3,
    "category": "Cinema",
    "text": "Qual o pior lugar para levar alguém num primeiro encontro?"
  }
]