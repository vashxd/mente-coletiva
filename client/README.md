# 🧠 A Mente Coletiva

> **"Não tente ser o mais inteligente. Tente pensar como todo mundo."**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A Mente Coletiva** é um Party Game Multiplayer em tempo real inspirado nos clássicos da *Jackbox Games* e no board game *Herd Mentality*.

O objetivo é simples: Responder a perguntas subjetivas tentando adivinhar o que a **maioria** do grupo vai responder. Se sua resposta for igual a de todos, você ganha pontos. Se for o único a pensar diferente... bem, você ganha a **Vaca Rosa** 🐮.

---

## 🎮 Como Jogar

1.  **O Host**: Abre o jogo em uma tela grande (TV ou PC) em `/host`.
2.  **Os Jogadores**: Escaneiam o QR Code ou entram em `/play` pelo celular.
3.  **A Pergunta**: "Qual a melhor comida de domingo?"
4.  **A Resposta**: Todos digitam secretamente.
5.  **O Reveal**: O sistema agrupa as respostas iguais (ex: "Pizza" e "pizza" contam juntos!).
6.  **Pontuação**:
    *   Resposta Única (0 pessoas concordaram): **0 Pontos** (+ Vaca Rosa 🐮)
    *   Resposta em Grupo: **1 Ponto por pessoa no grupo**
    *   Mente Mestra (Todos iguais): **Dobro de Pontos!** 🧠✨

---

## ✨ Features

*   **Arquitetura Host/Controller**: Use seu celular como controle enquanto a ação acontece na TV.
*   **Modo Híbrido**: O Host também pode jogar! (Botão "Play too!")
*   **Fuzzy Matching**: Algoritmo inteligente que agrupa respostas similares (Typos, acentos, plural).
*   **Design Premium**: Interface animada com **Framer Motion** e estilo Neon/Dark.
*   **PWA Ready**: Instale no celular como um app nativo (com Wake Lock para a tela não apagar).
*   **Monetização**: Espaços reservados para AdSense.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
*   Node.js (v18+)
*   NPM

### Instalação

Clone o repositório:
```bash
git clone https://github.com/seu-usuario/mente-coletiva.git
cd mente-coletiva
```

### 1. Backend (Server)
```bash
cd server
npm install
npm start
# Roda na porta 3000
```

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
# Roda na porta 5173
```

Acesse `http://localhost:5173/host` para iniciar uma sala!

---

## ☁️ Deploy (Gratuito)

Este projeto foi otimizado para deploy em serviços gratuitos:

*   **Backend**: Recomendado **Render** (Web Service).
*   **Frontend**: Recomendado **Vercel**.

Consulte o arquivo `DEPLOY.md` para um guia passo a passo.

---

## 🛠️ Tecnologias

*   **Frontend**: Vite, React, TailwindCSS v4, Framer Motion.
*   **Backend**: Express, Socket.io (Websockets).
*   **Lógica**: `string-similarity` para agrupamento de texto.

---

Desenvolvido com 💜 e muita sincronia mental.
