# Guia de Deploy Gratuito - A Mente Coletiva

Como seu jogo usa **Socket.io** e armazena o estado do jogo **na memória** (sem banco de dados externo), você precisa de um servidor Backend que fique rodando continuamente (Persistent Server), e não apenas Funções Serverless.

Minha recomendação de ouro para **Plano Gratuito**:

1.  **Backend (Node.js)**: [Render](https://render.com) (Plano Free Web Service).
2.  **Frontend (React)**: [Vercel](https://vercel.com) (Plano Hobby).

---

## Parte 1: Preparando o Código

Antes de subir, precisamos garantir que o código esteja pronto para produção.

### 1. Crie um repositório no GitHub
Se ainda não criou, crie um repositório (ex: `mente-coletiva`) e suba todo o código (pastas `server` e `client`).

### 2. Configurar Variáveis de Ambiente
No seu código local, você provavelmente está usando `http://localhost:3000`. Na produção, isso precisa ser dinâmico.

**No Cliente (`client/src/services/socket.js`):**
Certifique-se que o socket está pegando a URL do ambiente:
```javascript
const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
```
*(Isso já deve estar configurado se seguiu o padrão).*

---

## Parte 2: Deploy do Backend (Render)

1.  Crie uma conta no [Render.com](https://dashboard.render.com).
2.  Clique em **New +** -> **Web Service**.
3.  Conecte seu repositório do GitHub.
4.  Configure:
    *   **Name**: `mente-coletiva-server`
    *   **Root Directory**: `server` (Importante! Pois seu `package.json` está dentro dessa pasta)
    *   **Environment**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Plan**: Free
5.  Clique em **Create Web Service**.

O Render vai demorar alguns minutos. Quando terminar, ele vai te dar uma URL (ex: `https://mente-coletiva-server.onrender.com`).
**Copie essa URL.**

> **Nota sobre o Plano Free do Render**: O servidor "dorme" após 15 minutos de inatividade. O primeiro acesso pode demorar uns 50 segundos para "acordar". Para um jogo casual, isso é aceitável.

---

## Parte 3: Deploy do Frontend (Vercel)

1.  Crie uma conta na [Vercel](https://vercel.com).
2.  Clique em **Add New...** -> **Project**.
3.  Importe o mesmo repositório do GitHub.
4.  Configure:
    *   **Framework Preset**: Vite (ele deve detectar automático).
    *   **Root Directory**: Clique em "Edit" e selecione a pasta `client`.
    *   **Environment Variables**:
        *   Nome: `VITE_SERVER_URL`
        *   Valor: `https://mente-coletiva-server.onrender.com` (A URL que você copiou do Render, **sem** a barra `/` no final).
5.  Clique em **Deploy**.

---

## Resumo
- **Backend rodando em**: `https://mente-coletiva-server.onrender.com`
- **Jogue em**: `https://seu-projeto-na-vercel.app`

Compartilhe o link da Vercel com seus amigos! 🚀
