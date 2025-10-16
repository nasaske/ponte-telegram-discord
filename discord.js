/**
 * discord.gs — payload/embeds e post via webhook
 */

function makeDiscordPayload_({ content, embeds }) {
  const cfg = CONFIG; // global
  return {
    content: content || '',
    username: cfg.BOT_USERNAME || undefined,
    avatar_url: cfg.BOT_AVATAR_URL || undefined,
    allowed_mentions: { users: [], roles: [], parse: [] },
    embeds
  };
}

function postDiscord_(webhookUrl, payload) {
  if (!webhookUrl) return;
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });
  } catch (err) {
    console.log('postDiscord_ error:', String(err));
  }
}

function mention_(id){ return id ? `<@${id}> ` : ''; }

function buildOfflineMsg_(state, deltaMs) {
  const mins = Math.round(deltaMs / 60000);
  const fields = [];
  if (state.meta?.host)    fields.push({ name:'Host', value:String(state.meta.host), inline:true });
  if (state.meta?.env)     fields.push({ name:'Env',  value:String(state.meta.env),  inline:true });
  if (state.meta?.version) fields.push({ name:'Ver',  value:String(state.meta.version), inline:true });

  return makeDiscordPayload_({
    content: `${mention_(state.discord_user_id)}⚠️ OFFLINE: \`${state.app_id}\``,
    embeds: [{
      title:'Heartbeat perdido',
      description:`Sem batimentos há ~${mins} min.`,
      color:0xE74C3C,
      fields,
      timestamp:new Date().toISOString()
    }]
  });
}

function buildOnlineMsg_(state) {
  const fields = [];
  if (state.meta?.host)    fields.push({ name:'Host', value:String(state.meta.host), inline:true });
  if (state.meta?.env)     fields.push({ name:'Env',  value:String(state.meta.env),  inline:true });
  if (state.meta?.version) fields.push({ name:'Ver',  value:String(state.meta.version), inline:true });

  return makeDiscordPayload_({
    content: `${mention_(state.discord_user_id)}✅ ONLINE novamente: \`${state.app_id}\``,
    embeds: [{
      title:'Heartbeat restaurado',
      color:0x2ECC71,
      fields,
      timestamp:new Date().toISOString()
    }]
  });
}
