/**
 * telegram.gs — polling getUpdates → Discord
 */

function tgPollOnce() {
  const cfg = CONFIG;
  if (!cfg.TG_ENABLED) return;

  const T = PropertiesService.getScriptProperties();
  const token = cfg.TG_BOT_TOKEN;
  if (!token) { console.log('TG_BOT_TOKEN ausente'); return; }

  // evita reenviar histórico
  let startedMs = Number(T.getProperty('TG_STARTED_MS') || 0);
  if (!startedMs) {
    startedMs = Date.now();
    T.setProperty('TG_STARTED_MS', String(startedMs));
  }

  // continua do último update_id
  let offset = Number(T.getProperty('TG_LAST_UPDATE_ID') || 0);
  const url = 'https://api.telegram.org/bot' + token +
              '/getUpdates?timeout=0' + (offset ? ('&offset=' + (offset + 1)) : '');

  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    console.log('getUpdates:', resp.getResponseCode(), resp.getContentText());
    return;
  }
  const data = JSON.parse(resp.getContentText());
  if (!data.ok) {
    console.log('getUpdates not ok:', resp.getContentText());
    return;
  }

  const updates = data.result || [];
  if (!updates.length) return;

  updates.forEach(upd => {
    offset = upd.update_id;

    const msg = upd.message || upd.edited_message || upd.channel_post || upd.edited_channel_post || null;
    if (!msg) return;

    const msgMs = ((msg.date || Math.floor(Date.now()/1000)) * 1000);
    if (msgMs < startedMs) return;

    // whitelist opcional
    if (Array.isArray(cfg.TG_CHAT_WHITELIST) && cfg.TG_CHAT_WHITELIST.length) {
      const cid = String(msg.chat?.id || '');
      const cname = (msg.chat?.username ? '@'+msg.chat.username : '').toLowerCase();
      const ok = cfg.TG_CHAT_WHITELIST.some(v => String(v) === cid || String(v).toLowerCase() === cname);
      if (!ok) return;
    }

    // ignorar mensagens de serviço de grupos/canais
    if (cfg.TG_IGNORE_SERVICE_MSGS && isServiceMessage_(msg)) return;

    const text = String(msg.text || msg.caption || '').trim();
    if (!text) return; // só repassa se há texto/caption

    const chatTitle = msg.chat?.title || msg.chat?.username || String(msg.chat?.id || '');
    const fromName =
      [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') ||
      msg.from?.username || msg.sender_chat?.title || 'desconhecido';

    const lowered = text.toLowerCase();
    const isAlert = /(desconectad|offline|queda|falha|erro|inativo|sem conex)/.test(lowered);
    const color   = isAlert ? 0xE74C3C : 0x5865F2;

    const fields = [
      chatTitle ? { name:'Origem', value:String(chatTitle), inline:true } : null,
      { name:'Remetente', value: fromName, inline:true }
    ].filter(Boolean);

    const payload = makeDiscordPayload_({
      content: '',
      embeds: [{
        title: isAlert ? 'Alerta (Telegram)' : 'Notificação (Telegram)',
        description: text,
        color,
        fields,
        timestamp: new Date(msgMs).toISOString()
      }]
    });

    const webhook = cfg.WEBHOOK_MAP[cfg.TG_FORWARD_TO_APP_ID];
    if (webhook) postDiscord_(webhook, payload);
  });

  if (offset) PropertiesService.getScriptProperties().setProperty('TG_LAST_UPDATE_ID', String(offset));
}

// cria/limpa o gatilho do polling
function tgEnablePolling() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tgPollOnce').timeBased().everyMinutes(1).create();
  tgPollOnce();
}
function tgDisablePolling() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'tgPollOnce') ScriptApp.deleteTrigger(t);
  });
}

// útil se seu bot estava com webhook ativo (polling não funciona com webhook ligado)
function tgDeleteWebhook() {
  const token = CONFIG.TG_BOT_TOKEN;
  if (!token) return;
  const u = 'https://api.telegram.org/bot' + token + '/deleteWebhook?drop_pending_updates=true';
  const r = UrlFetchApp.fetch(u, { muteHttpExceptions: true });
  console.log('deleteWebhook', r.getResponseCode(), r.getContentText());
}

// detecta mensagens de serviço
function isServiceMessage_(m) {
  return !!(m.new_chat_members || m.left_chat_member || m.new_chat_title || m.new_chat_photo ||
            m.delete_chat_photo || m.group_chat_created || m.supergroup_chat_created ||
            m.channel_chat_created || m.migrate_to_chat_id || m.migrate_from_chat_id ||
            m.pinned_message || m.successful_payment || m.connected_website);
}
