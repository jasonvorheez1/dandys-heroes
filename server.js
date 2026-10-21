// Dandy's Heroes cloud save backend.
// The database is private to this project; rows are attributed to the signed-in
// Websim user so platform moderation can remove them when necessary.

const SAVE_TABLE = `
  CREATE TABLE IF NOT EXISTS dandys_heroes_saves (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    save_json TEXT NOT NULL,
    mastery INTEGER NOT NULL DEFAULT 0,
    heroes INTEGER NOT NULL DEFAULT 0,
    deepest_floor INTEGER NOT NULL DEFAULT 0,
    updated_at_ms INTEGER NOT NULL
  )
`;

const ARENA_DEFENSE_TABLE = `
  CREATE TABLE IF NOT EXISTS arena_defenses (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    team_json TEXT NOT NULL,
    arena_rank INTEGER NOT NULL DEFAULT 2000,
    reset_cycle INTEGER NOT NULL DEFAULT 0,
    updated_at_ms INTEGER NOT NULL
  )
`;

const ARENA_RESET_MS = 2 * 86400000;
const ARENA_RESET_EPOCH_MS = Date.UTC(2026, 0, 5);

function arenaResetCycle(now) {
  return Math.floor(((Number(now) || Date.now()) - ARENA_RESET_EPOCH_MS) / ARENA_RESET_MS);
}

async function ensureArenaDefenseTable(env) {
  await env.DB.exec(ARENA_DEFENSE_TABLE);
  // Existing projects have the original team-only table. D1/SQLite has no
  // IF NOT EXISTS form for ADD COLUMN, so each migration is intentionally
  // best-effort and becomes a no-op once the column exists.
  await env.DB.exec('ALTER TABLE arena_defenses ADD COLUMN arena_rank INTEGER NOT NULL DEFAULT 2000').catch(() => {});
  await env.DB.exec('ALTER TABLE arena_defenses ADD COLUMN reset_cycle INTEGER NOT NULL DEFAULT 0').catch(() => {});
  const cycle = arenaResetCycle();
  await env.DB.prepare(
    'UPDATE arena_defenses SET arena_rank = 2000, reset_cycle = ? WHERE reset_cycle IS NULL OR reset_cycle != ?'
  ).bind(cycle, cycle).run();
  return cycle;
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

function cleanText(value, max) {
  return String(value == null ? '' : value).replace(/[<>]/g, '').trim().slice(0, max);
}

function cleanNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}

function cleanDefenseTeam(team) {
  if (!Array.isArray(team)) return null;
  const out = team.slice(0, 5).map(slot => {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return null;
    const id = cleanText(slot.id, 48);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    const copy = {
      id,
      level: cleanNumber(slot.level, 1, 1000, 1),
      stars: cleanNumber(slot.stars, 1, 6, 1),
      rarity: cleanNumber(slot.rarity, 1, 6, 1),
      rarityPlus: cleanNumber(slot.rarityPlus, 1, 30, 1),
      skillLv: cleanNumber(slot.skillLv, 1, 1000, 1),
      cls: cleanText(slot.cls, 24) || null,
      subcls: cleanText(slot.subcls, 24) || null,
      cls2: cleanText(slot.cls2, 24) || null,
      subcls2: cleanText(slot.subcls2, 24) || null,
      classRank: cleanNumber(slot.classRank, 0, 10, 0),
      subclassRank: cleanNumber(slot.subclassRank, 0, 10, 0),
      classRank2: cleanNumber(slot.classRank2, 0, 10, 0),
      subclassRank2: cleanNumber(slot.subclassRank2, 0, 10, 0),
      mult: { hp: 1, atk: 1, def: 1 },
      trinkets: [],
      badge: null
    };
    if (Array.isArray(slot.trinkets)) {
      copy.trinkets = slot.trinkets.slice(0, 3).map(item => {
        if (!item || typeof item !== 'object') return null;
        const itemId = cleanText(item.id, 64);
        return /^[A-Za-z0-9_-]+$/.test(itemId)
          ? { id: itemId, rank: cleanNumber(item.rank, 1, 10, 1) }
          : null;
      }).filter(Boolean);
    }
    if (slot.badge && typeof slot.badge === 'object') {
      const badgeId = cleanText(slot.badge.id, 64);
      if (/^[A-Za-z0-9_-]+$/.test(badgeId)) {
        copy.badge = { id: badgeId, lvl: cleanNumber(slot.badge.lvl, 1, 10, 1) };
      }
    }
    return copy;
  }).filter(Boolean);
  return out.length ? out : null;
}

function parseDefense(row) {
  let team;
  try { team = JSON.parse(row.team_json); }
  catch (_) { return null; }
  if (!Array.isArray(team) || !team.length) return null;
  return {
    user_id: row.user_id,
    username: row.username || 'Player',
    team,
    arena_rank: cleanNumber(row.arena_rank, 1, 99999, 2000),
    updated_at_ms: Number(row.updated_at_ms) || 0
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/arena/defenses') {
      await ensureArenaDefenseTable(env);
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const viewerId = request.headers.get('x-websim-user-id');
      const query = viewerId
        ? env.DB.prepare('SELECT user_id, username, team_json, arena_rank, updated_at_ms FROM arena_defenses WHERE user_id != ? ORDER BY updated_at_ms DESC LIMIT 40').bind(viewerId)
        : env.DB.prepare('SELECT user_id, username, team_json, arena_rank, updated_at_ms FROM arena_defenses ORDER BY updated_at_ms DESC LIMIT 40');
      const { results } = await query.all();
      return Response.json({ defenses: results.map(parseDefense).filter(Boolean) });
    }

    if (url.pathname === '/api/arena/defense') {
      const userId = request.headers.get('x-websim-user-id');
      if (!userId) return jsonError('Sign in to publish a defense team', 401);
      const resetCycle = await ensureArenaDefenseTable(env);
      if (request.method !== 'POST') return jsonError('Method not allowed', 405);
      let body;
      try { body = await request.json(); }
      catch (_) { return jsonError('Invalid JSON', 400); }
      const team = cleanDefenseTeam(body && body.team);
      if (!team) return jsonError('Choose at least one Hero for your defense', 400);
      const arenaRank = cleanNumber(body && body.arenaRank, 1, 99999, 2000);
      const username = cleanText(request.headers.get('x-websim-username') || 'Player', 64) || 'Player';
      const updatedAt = Date.now();
      await env.DB
        .prepare(
          'INSERT INTO arena_defenses (user_id, username, team_json, arena_rank, reset_cycle, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, team_json = excluded.team_json, arena_rank = excluded.arena_rank, reset_cycle = excluded.reset_cycle, updated_at_ms = excluded.updated_at_ms'
        )
        .bind(userId, username, JSON.stringify(team), arenaRank, resetCycle, updatedAt)
        .run();
      return Response.json({ ok: true, defense: { user_id: userId, username, team, arena_rank: arenaRank, updated_at_ms: updatedAt } });
    }

    if (url.pathname !== '/api/save') return new Response('Not found', { status: 404 });

    const userId = request.headers.get('x-websim-user-id');
    if (!userId) return jsonError('Sign in to use cloud saves', 401);

    await env.DB.exec(SAVE_TABLE);

    if (request.method === 'GET') {
      const row = await env.DB
        .prepare('SELECT username, save_json, mastery, heroes, deepest_floor, updated_at_ms FROM dandys_heroes_saves WHERE user_id = ?')
        .bind(userId)
        .first();
      return Response.json({ save: row || null });
    }

    if (request.method !== 'PUT' && request.method !== 'POST') {
      return jsonError('Method not allowed', 405);
    }

    let body;
    try { body = await request.json(); }
    catch (_) { return jsonError('Invalid JSON', 400); }

    const save = body && body.save;
    if (!save || typeof save !== 'object' || Array.isArray(save)) {
      return jsonError('Invalid save data', 400);
    }
    if (save._saveKind === 'full-test') {
      return jsonError('Full Test Save cannot be stored in the cloud', 400);
    }

    const saveJson = JSON.stringify(save);
    if (saveJson.length > 120000) return jsonError('Save is too large', 413);
    if (!save.heroes || !save.res || typeof save.heroes !== 'object' || typeof save.res !== 'object') {
      return jsonError('Save is missing required data', 400);
    }

    const username = request.headers.get('x-websim-username') || '';
    const mastery = Number.isFinite(Number(save.mastery)) ? Math.max(0, Math.floor(Number(save.mastery))) : 0;
    const heroes = Object.keys(save.heroes).length;
    const deepestFloor = Number.isFinite(Number(save.bestFloor)) ? Math.max(0, Math.floor(Number(save.bestFloor))) : 0;
    const updatedAt = Date.now();

    // Do not let a delayed request from an older tab/device roll the account
    // back. The client carries the last server timestamp in _updatedAt after
    // a successful upload; a newer cloud row wins over an older snapshot.
    const existing = await env.DB
      .prepare('SELECT save_json, mastery, heroes, deepest_floor, updated_at_ms, username FROM dandys_heroes_saves WHERE user_id = ?')
      .bind(userId)
      .first();
    const incomingAt = Number(save._updatedAt) || 0;
    if (existing && (
      incomingAt <= 0 ||
      Number(existing.updated_at_ms) > incomingAt ||
      (Number(existing.updated_at_ms) === incomingAt && existing.save_json !== saveJson)
    )) {
      return Response.json({
        error: 'Cloud save is newer',
        save: existing
      }, { status: 409 });
    }

    await env.DB
      .prepare(
        'INSERT INTO dandys_heroes_saves (user_id, username, save_json, mastery, heroes, deepest_floor, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, save_json = excluded.save_json, mastery = excluded.mastery, heroes = excluded.heroes, deepest_floor = excluded.deepest_floor, updated_at_ms = excluded.updated_at_ms'
      )
      .bind(userId, username, saveJson, mastery, heroes, deepestFloor, updatedAt)
      .run();

    return Response.json({
      ok: true,
      save: { username, save_json: saveJson, mastery, heroes, deepest_floor: deepestFloor, updated_at_ms: updatedAt }
    });
  }
};
