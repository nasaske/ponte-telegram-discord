<div align="center">

# 🛰️ ponte-telegram-discord

### _Bridge Telegram → Discord + Monitor de Heartbeat em Google Apps Script, com configuração 100% via Script Properties (sem segredos no código)._

![Hero Gradient](https://singlecolorimage.com/get/229ED9/600x5)
![Hero Gradient](https://singlecolorimage.com/get/5865F2/600x5)

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram Logo" width="48"/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <strong>✈️ → 🌀</strong>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://i.redd.it/5zec9qw4ppy61.png" alt="Discord Logo" width="48"/>
</p>

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-informational?logo=googleapps)
![Telegram Bot API](https://img.shields.io/badge/Telegram%20Bot%20API-integrated-blue?logo=telegram)
![Discord Webhook](https://img.shields.io/badge/Discord%20Webhook-supported-5865F2?logo=discord)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

### 📌 Visão Geral

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

| Chave | Valor (exemplo) | Observações |
|------|------|------------------------|
| `SECRET` | `sua-super-secret` | Verificada no doPost |
| `HEARTBEAT_TTL_SEC` | `90` | Segundos para considerar offline |
| `ALERT_COOLDOWN_MIN` | `10` | Minutos entre alertas offline |
| `BOT_USERNAME` | `ChatApp Status Bot` | Opcional |
| `BOT_AVATAR_URL` | `(URL ou vazio)` | Opcional |
| `STORE_NS` | `CHATAPP_HEARTBEATS` | Prefixo de storage |
| `WEBHOOK_MAP` | `{"chatapp-prod-01":"https://discord.com/api/webhooks/XXX"}` | JSON app_id → webhook |
| `TG_ENABLED` | `true` | true/false |
| `TG_BOT_TOKEN` | `123456:ABCDEF...` | Token do @BotFather |
| `TG_FORWARD_TO_APP_ID` | `chatapp-prod-01` | Chave existente no WEBHOOK_MAP |
| `TG_CHAT_WHITELIST` | `[]` | Ex.: `["123456789","@meucanal"]` |
| `TG_IGNORE_SERVICE_MSGS` | `true` | Ignora mensagens de serviço |
> 💡 **Dica:** após alterar Script Properties, execute `reloadConfig()` ou qualquer função para recarregar CONFIG.


### `.env` (scripts locais — opcional)

```dotenv
# Usado APENAS em scripts locais (ex.: push via API)
SCRIPT_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Nunca commitar segredos reais
```

## 🧠 Como funciona (resumo técnico)

- `CONFIG = Env.config()` lê Script Properties
- `Env.assertRequired` valida chaves mínimas
- `Store` usa Script Properties para persistir estado:
  - Último heartbeat
  - Flags de alerta
  - Offset do Telegram
- `discord.gs` monta payload/embeds
- `telegram.gs` faz polling com `getUpdates`
- `monitorHeartbeats()` verifica `now - last_heartbeat_ms` e dispara alerta se exceder `HEARTBEAT_TTL_SEC` (respeitando `ALERT_COOLDOWN_MIN`)


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
├─ state.gs (Env: leitura de Script Properties; Store: storage em Script Properties)
├─ discord.gs (payload de embed + envio via webhook do Discord)
├─ telegram.gs (polling getUpdates, whitelist, filtros, forward)
├─ Code.gs (CONFIG via Env, doGet/doPost, monitorHeartbeats(), utils)
└─ appsscript.json (opcional: manifest com timezone/runtime)
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

| Erro / Sintoma | Possível causa |
|----------------|----------------|
| `401 unauthorized` | `SECRET` inválida ou ausente |
| Polling não roda | `TG_ENABLED` falso, token incorreto ou gatilho ausente |
| Nada chega no Discord | `WEBHOOK_MAP` inválido ou `app_id` não existe |
| Alerta OFFLINE nunca dispara | Gatilho de `monitorHeartbeats()` ausente ou TTL alto |

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

Desenvolvido por Davi Parma
[📚 Telegram Bot API](https://core.telegram.org/bots/api) ・ [📘 Discord Webhook Docs](https://discord.com/developers/docs/resources/webhook)

</div>