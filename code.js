/**
 * Code.gs — handlers (doGet/doPost), monitorHeartbeats, util
 */

// CONFIG global (carregado de Script Properties)
var CONFIG = Env.config();
function reloadConfig() { CONFIG = Env.config(); }

function _assertConfigBase_() {
  Env.assertRequired(['SECRET', 'WEBHOOK_MAP'], CONFIG);
  if (CONFIG.TG_ENABLED) Env.assertRequired(['TG_BOT_TOKEN', 'TG_FORWARD_TO_APP_ID'], CONFIG);
}

function doGet() {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  _assertConfigBase_();
  try {
    const body = parseJson_(e);
    if (!body || body.secret !== CONFIG.SECRET) return json_(401, { ok:false, error:'unauthorized' });

    const action = String(body.action || '').toLowerCase();
    if (action === 'heartbeat') return handleHeartbeat_(body);
    if (action === 'message')   return handleMessage_(body);
    return json_(400, { ok:false, error:'unknown_action' });
  } catch (err) {
    return json_(500, { ok:false, error:String(err) });
  }
}

/** Heartbeat → grava estado e envia ONLINE se estava marcado offline */
function handleHeartbeat_(body) {
  const app_id = String(body.app_id || '');
  if (!app_id) return json_(400, { ok:false, error:'missing app_id' });

  const fixed = CONFIG.WEBHOOK_MAP?.[app_id];
  const webhook = fixed || String(body.discord_webhook || '');
  if (!webhook) return json_(400, { ok:false, error:'missing discord_webhook' });

  const now = Date.now();
  const prev = Store.readState(CONFIG.STORE_NS, app_id) || {};
  const state = {
    app_id,
    discord_webhook: webhook,
    discord_user_id: body.discord_user_id || prev.discord_user_id || null,
    meta: body.meta || prev.meta || {},
    last_heartbeat_ms: now,
    offline_alert_sent: !!prev.offline_alert_sent,
    last_alert_ms: prev.last_alert_ms || 0
  };

  if (state.offline_alert_sent) {
    postDiscord_(state.discord_webhook, buildOnlineMsg_(state));
    state.offline_alert_sent = false;
  }
  Store.writeState(CONFIG.STORE_NS, app_id, state);
  return json_(200, { ok:true, stored:{ app_id, ts: now } });
}

/** Message → manda conteúdo/embeds para o webhook do app/canal */
function handleMessage_(body) {
  const webhook = body.discord_webhook || (body.app_id ? CONFIG.WEBHOOK_MAP?.[body.app_id] : null);
  if (!webhook) return json_(400, { ok:false, error:'missing discord_webhook' });

  const payload = makeDiscordPayload_({
    content: body.content || '',
    embeds: Array.isArray(body.embeds) ? body.embeds : undefined
  });
  postDiscord_(webhook, payload);
  return json_(200, { ok:true, sent:true });
}

/** monitorHeartbeats — varre estado e alerta OFFLINE quando delta > TTL */
function monitorHeartbeats() {
  _assertConfigBase_();
  const now = Date.now();
  const ttlMs = CONFIG.HEARTBEAT_TTL_SEC * 1000;
  const cooldownMs = CONFIG.ALERT_COOLDOWN_MIN * 60 * 1000;

  for (const k of Store.listKeys(CONFIG.STORE_NS)) {
    const state = Store.readRawByKey_(k); // leitura bruta por key
    if (!state?.app_id || !state?.discord_webhook) continue;

    const last = Number(state.last_heartbeat_ms || 0);
    const delta = now - last;
    const offline = delta > ttlMs;

    if (offline) {
      const canAlert = !state.offline_alert_sent || (now - (state.last_alert_ms || 0) > cooldownMs);
      if (canAlert) {
        postDiscord_(state.discord_webhook, buildOfflineMsg_(state, delta));
        state.offline_alert_sent = true;
        state.last_alert_ms = now;
        Store.writeState(CONFIG.STORE_NS, state.app_id, state);
      }
    }
  }
}

/** Utils */
function parseJson_(e){ try { return JSON.parse(e?.postData?.contents || '{}'); } catch(_){ return null; } }
function json_(status, obj){
  const out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  return out.setResponseCode ? out.setResponseCode(status) : out;
}
