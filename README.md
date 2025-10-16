<div align="center">

# 🛰️ ponte-telegram-discord

### _Bridge Telegram → Discord + Heartbeat Monitor em Google Apps Script, com configuração segura e zero segredos em código._

![Hero Gradient](https://singlecolorimage.com/get/229ED9/600x5)
![Hero Gradient](https://singlecolorimage.com/get/5865F2/600x5)

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram Logo" width="48"/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <strong>✈️ → 🌀</strong>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://i.redd.it/5zec9qw4ppy61.png" alt="Discord Logo" width="48"/>
</p>

![GAS](https://img.shields.io/badge/Google%20Apps%20Script-powered-informational?logo=google)
![Telegram API](https://img.shields.io/badge/Telegram%20Bot%20API-v5-blue?logo=telegram)
![Discord Webhook](https://img.shields.io/badge/Discord%20Webhook-integrated-blurple?logo=discord)
![Status](https://img.shields.io/badge/status-stable-brightgreen)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

## 📌 Visão Geral

Relay de mensagens do **Telegram → Discord** via polling + monitor de **heartbeats** com alertas de status *offline/online*, desenvolvido em Google Apps Script.

### ✨ Diferenciais

- ✅ Polling com whitelist opcional
- 🚨 Heurística para mensagens de alerta
- 🌐 Envio para Discord via webhook mapeado por app
- ❤️ Monitor de batimentos (TTL + cooldown)
- 🔐 Sem segredos hardcoded — uso exclusivo de Script Properties
- ⚙️ Casos de uso: status bots, logs operacionais, alertas de serviços, NOC

## 📋 Requisitos

### ✅ Obrigatórios

- Conta Google com acesso ao Google Apps Script
- Bot do Telegram (token via [@BotFather](https://t.me/botfather))
- Webhook do Discord ativo

### 🧪 Opcionais (dev/local)

- Node.js `v18+`
- NPM `v9+`
- Extensão [Apps Script GitHub Assistant](https://workspace.google.com/marketplace/app/github_assistant_for_apps_script/190726133798)

## 🧩 Instalação

### 🔹 Rota A — Editor do Apps Script (manual)

1. Vá em [script.new](https://script.new)
2. Cole todos os arquivos do repositório
3. Acesse `Project Settings → Script Properties` e configure conforme seção ⚙️
4. Execute `tgDeleteWebhook()` (se aplicável), depois `tgEnablePolling()`

### 🔸 Rota B — GitHub → Apps Script (com extensão)

1. Suba o repositório no GitHub
2. No Apps Script, use **GitHub Assistant** para fazer pull dos arquivos
3. Configure as `Script Properties`
4. Execute `tgEnablePolling()`

## ⚙️ Configuração

Todos os ajustes e segredos devem estar nas **Script Properties**:

| Chave | Tipo | Exemplo / Observação |
|------|------|------------------------|
| `SECRET` | string | Segredo usado por `doPost()` |
| `HEARTBEAT_TTL_SEC` | number | `90` |
| `ALERT_COOLDOWN_MIN` | number | `10` |
| `BOT_USERNAME` | string | `ChatApp Status Bot` |
| `BOT_AVATAR_URL` | string | URL do avatar |
| `STORE_NS` | string | `CHATAPP_HEARTBEATS` |
| `WEBHOOK_MAP` | JSON | `{"chatapp-prod-01": "https://discord.com/api/webhooks/..."}` |
| `TG_ENABLED` | boolean | `true` |
| `TG_BOT_TOKEN` | string | Token do bot Telegram |
| `TG_FORWARD_TO_APP_ID` | string | `chatapp-prod-01` |
| `TG_CHAT_WHITELIST` | JSON array | `[]` ou lista de IDs |
| `TG_IGNORE_SERVICE_MSGS` | boolean | `true` |

### `.env` (scripts locais — opcional)

```dotenv
SCRIPT_ID=coloque_o_seu
GOOGLE_CLIENT_ID=coloque_o_seu
GOOGLE_CLIENT_SECRET=coloque_o_seu
```

## 🚀 Deploy / Execução

- **Web App**: Implante se quiser usar `doPost()`
- **Polling Telegram**:
  ```js
  tgEnablePolling(); // cria gatilho
  tgDisablePolling(); // remove
  tgDeleteWebhook(); // desativa webhook
  ```

- **Triggers**: `Edit → Current project's triggers`

## 🎯 Uso

### 1. Via Web App

```json
POST / {
  "secret": "<SECRET>",
  "action": "heartbeat",
  "app_id": "my-app",
  "meta": {
    "host": "srv-01",
    "env": "prod",
    "version": "1.2.3"
  }
}
```

```json
POST / {
  "secret": "<SECRET>",
  "action": "message",
  "app_id": "chatapp-prod-01",
  "content": "Deploy finalizado"
}
```

### 2. Telegram → Discord

- Lê mensagens e captions
- Heurísticas para alerta: `offline`, `erro`, `queda`, etc.

### Exemplos curl

```bash
curl -X POST "$WEB_APP_URL" -H "Content-Type: application/json" -d '{
  "secret":"<SECRET>",
  "action":"heartbeat",
  "app_id":"chatapp-prod-01",
  "meta":{"env":"prod","host":"gke-node-1"}
}'
```

```bash
curl -X POST "$WEB_APP_URL" -H "Content-Type: application/json" -d '{
  "secret":"<SECRET>",
  "action":"message",
  "app_id":"chatapp-prod-01",
  "content":"Build concluído ✅"
}'
```

## 🏗 Arquitetura

```
Google Apps Script
├─ telegram.gs (polling)
├─ discord.gs (webhook embed)
├─ state.gs (storage via Script Properties)
├─ Code.gs (handlers)
└─ monitorHeartbeats()
```

## 🔐 Segurança

- ❌ Nunca commit tokens ou webhooks reais
- ✅ Use `SECRET` para validar `doPost`
- 🔁 Rotacione `TG_BOT_TOKEN` e `SECRET` regularmente
- 🔒 Restringir Web App (quando usado)
- ✅ Webhooks simbólicos no `WEBHOOK_MAP`

## 🧪 Testes rápidos

- Envie `action=message` e confirme no Discord
- Envie msg no Telegram → verifique relay
- Simule ausência de heartbeat → aguarde alerta

## 🛠 Troubleshooting

| Problema | Causa |
|----------|-------|
| 401 Unauthorized | `SECRET` ausente ou incorreta |
| Polling não responde | `TG_BOT_TOKEN` errado ou `TG_ENABLED=false` |
| Nada no Discord | Verifique `WEBHOOK_MAP` e `app_id` usado |
| Webhook ativo no bot | Execute `tgDeleteWebhook()` |

## 🤝 Contribuição

- Fork → branch `feat/sua-feature`
- Commits convencionais
- Issues bem descritas com logs/contexto

## 🗺 Roadmap

- [ ] Filtros regex customizáveis
- [ ] Suporte a mídia/anexos
- [ ] Painel status com HTMLService
- [ ] Backup/exportação do estado

## 📝 Licença

Distribuído sob licença [MIT](LICENSE).

---

<div align="center">

Google Apps Script  
[📚 Telegram Bot API Docs](https://core.telegram.org/bots/api) ・ [📘 Discord Webhook Docs](https://discord.com/developers/docs/resources/webhook)

</div>