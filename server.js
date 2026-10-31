// Dandy's Heroes cloud saves, arena defenses, and global rankings.
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

const PLUSH_TABLE = `
  CREATE TABLE IF NOT EXISTS plush_scores (
    user_id TEXT NOT NULL,
    username TEXT,
    mode TEXT NOT NULL,
    week INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    updated_at_ms INTEGER NOT NULL,
    PRIMARY KEY (user_id, mode, week)
  )
`;
const PLUSH_WEEK_MS = 7 * 86400000;
function plushWeek(now) {
  return Math.floor(((Number(now) || Date.now()) - ARENA_RESET_EPOCH_MS) / PLUSH_WEEK_MS);
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

function cleanCostume(value) {
  const id = cleanText(value, 48);
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

function isFullTestSave(save) {
  if (!save || typeof save !== 'object') return false;
  if (save._saveKind === 'full-test') return true;
  const resources = save.res || {};
  const heroes = save.heroes || {};
  // Older fixture exports had no marker. Their stocked economy and almost
  // entirely maxed roster together identify them without excluding players
  // who happen to reach one of these milestones in normal play.
  return Number(save.bestFloor) >= 120 && Number(resources.ichor) >= 999999
    && Number(resources.arenaCoin) >= 9999 && Number(resources.main) >= 999
    && Number(save.shop && save.shop.level) >= 100
    && Object.values(heroes).filter(hero => hero && Number(hero.level) >= 700
      && Number(hero.rarity) === 6 && Number(hero.rarityPlus) >= 30).length >= 50;
}

function cleanDefenseTeam(team) {
  if (!Array.isArray(team)) return null;
  const out = team.slice(0, 5).map(slot => {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return null;
    const id = cleanText(slot.id, 48);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
    const copy = {
      id,
      costume: cleanCostume(slot.costume),
      level: cleanNumber(slot.level, 1, 800, 1),
      stars: cleanNumber(slot.stars, 1, 5, 1),
      rarity: cleanNumber(slot.rarity, 1, 6, 1),
      rarityPlus: cleanNumber(slot.rarityPlus, 1, 30, 1),
      skillLv: cleanNumber(slot.skillLv, 1, 800, 1),
      skillLevels: null,
      cls: cleanText(slot.cls, 24) || null,
      subcls: cleanText(slot.subcls, 24) || null,
      cls2: cleanText(slot.cls2, 24) || null,
      subcls2: cleanText(slot.subcls2, 24) || null,
      classRank: cleanNumber(slot.classRank, 0, 50, 0),
      subclassRank: cleanNumber(slot.subclassRank, 0, 50, 0),
      classRank2: cleanNumber(slot.classRank2, 0, 50, 0),
      subclassRank2: cleanNumber(slot.subclassRank2, 0, 50, 0),
      mult: { hp: 1, atk: 1, def: 1 },
      trinkets: [],
      badge: null
    };
    if (slot.skillLevels && typeof slot.skillLevels === 'object' && !Array.isArray(slot.skillLevels)) {
      copy.skillLevels = Object.fromEntries(['W', 'G', 'B', 'P', 'R'].map(key =>
        [key, cleanNumber(slot.skillLevels[key], 1, 800, copy.skillLv)]));
    }
    if (Array.isArray(slot.trinkets)) {
      copy.trinkets = slot.trinkets.slice(0, 3).map(item => {
        if (!item || typeof item !== 'object') return null;
        const itemId = cleanText(item.id, 64);
        return /^[A-Za-z0-9_-]+$/.test(itemId)
          ? { id: itemId, rank: cleanNumber(item.rank, 1, 20, 1) }
          : null;
      }).filter(Boolean);
    }
    if (Array.isArray(slot.mods)) {
      const modTypes = { hp: ['armor', 'reality', 'shield'], bd: ['aspd', 'crit', 'supercrit'], sp: ['white', 'green', 'blue', 'purple'], atk: ['aspd', 'crit', 'supercrit'], mag: ['white', 'green', 'blue', 'purple'] };
      copy.mods = slot.mods.slice(0, 4).map(item => {
        if (!item || typeof item !== 'object' || !modTypes[item.type]) return null;
        return { type: item.type, level: cleanNumber(item.level, 1, 400, 1), tier: cleanNumber(item.tier, 0, 10, 0),
          upg: modTypes[item.type].includes(item.upg) ? item.upg : null };
      }).filter(Boolean);
    }
    if (slot.badge && typeof slot.badge === 'object') {
      const badgeId = cleanText(slot.badge.id, 64);
      if (/^[A-Za-z0-9_-]+$/.test(badgeId)) {
        copy.badge = { id: badgeId, lvl: cleanNumber(slot.badge.lvl, 1, 5, 1) };
      }
    }
    return copy;
  }).filter(Boolean);
  return out.length ? out : null;
}

function parseDefense(row) {
  let team, savedTeam;
  try { savedTeam = JSON.parse(row.team_json); team = cleanDefenseTeam(savedTeam); }
  catch (_) { return null; }
  if (!Array.isArray(team) || !team.length) return null;
  // Older defense records did not store costumes, so use the owner's saved
  // looks immediately. New snapshots remain authoritative until a later save.
  const hasCostumeSnapshot = savedTeam.some(slot => slot && Object.prototype.hasOwnProperty.call(slot, 'costume'));
  if (row.live_costumes && (!hasCostumeSnapshot || Number(row.save_updated_at_ms) > Number(row.updated_at_ms))) {
    try {
      const worn = JSON.parse(row.live_costumes);
      team.forEach(slot => { slot.costume = cleanCostume(worn[slot.id]); });
    } catch (_) { /* retain the published costume choices */ }
  }
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

    if (url.pathname === '/api/account') {
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const id = request.headers.get('x-websim-user-id');
      const username = request.headers.get('x-websim-username');
      const anonymous = request.headers.get('x-websim-user-is-anonymous') === 'true';
      const user = id && username && !anonymous
        ? { id, username, avatar_url: `https://images.websim.com/avatar/${encodeURIComponent(username)}` }
        : null;
      return Response.json({ user }, { headers: { 'cache-control': 'no-store' } });
    }

    if (url.pathname === '/api/leaderboard') {
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      await env.DB.exec(SAVE_TABLE);
      const legacyFixture = `(COALESCE(CAST(json_extract(s.save_json, '$.bestFloor') AS INTEGER), 0) >= 120
        AND COALESCE(CAST(json_extract(s.save_json, '$.res.ichor') AS INTEGER), 0) >= 999999
        AND COALESCE(CAST(json_extract(s.save_json, '$.res.arenaCoin') AS INTEGER), 0) >= 9999
        AND COALESCE(CAST(json_extract(s.save_json, '$.res.main') AS INTEGER), 0) >= 999
        AND COALESCE(CAST(json_extract(s.save_json, '$.shop.level') AS INTEGER), 0) >= 100
        AND (SELECT COUNT(*) FROM json_each(s.save_json, '$.heroes') fixture_hero
          WHERE CAST(json_extract(fixture_hero.value, '$.level') AS INTEGER) >= 700
          AND CAST(json_extract(fixture_hero.value, '$.rarity') AS INTEGER) = 6
          AND CAST(json_extract(fixture_hero.value, '$.rarityPlus') AS INTEGER) >= 30) >= 50)`;
      const eligible = `json_valid(s.save_json) AND COALESCE(json_extract(s.save_json, '$._saveKind'), 'main') != 'full-test' AND NOT ${legacyFixture}`;
      const namedPlayer = `${eligible} AND s.username IS NOT NULL AND s.username != ''`;
      const stageScore = `
        COALESCE((SELECT SUM(MIN(MAX(CAST(c.value AS INTEGER), 0), 20))
          FROM json_each(s.save_json, '$.campaigns') c), 0)
        + COALESCE((SELECT SUM(MIN(MAX(CAST(json_extract(t.value, '$.best') AS INTEGER), 0), 8))
          FROM json_each(s.save_json, '$.trials') t), 0)
        + COALESCE((SELECT COUNT(*) FROM json_each(s.save_json, '$.raid.clears') r
          JOIN json_each(r.value) cleared WHERE cleared.value = 1), 0)
        + COALESCE((SELECT SUM(MIN(MAX(CAST(old.value AS INTEGER), 0), 12))
          FROM json_each(s.save_json, '$.raid.stages') old
          WHERE NOT EXISTS (SELECT 1 FROM json_each(s.save_json, '$.raid.clears') r WHERE r.key = old.key)), 0)`;
      const [toonRows, masteryRows, stageRows, arenaRows, floorRows, playerCountRow] = await Promise.all([
        env.DB.prepare(`SELECT h.key AS toon_id,
          SUM(MIN(MAX(CAST(json_extract(h.value, '$.battles') AS INTEGER), 0), 100000000)) AS score
          FROM dandys_heroes_saves s, json_each(s.save_json, '$.heroes') h
          WHERE ${eligible} AND json_type(h.value) = 'object'
          GROUP BY h.key HAVING score > 0 ORDER BY score DESC, toon_id ASC`).all(),
        env.DB.prepare(`SELECT s.user_id, s.username, MIN(MAX(s.mastery, 0), 800) AS score
          FROM dandys_heroes_saves s WHERE ${namedPlayer}
          ORDER BY score DESC, s.username COLLATE NOCASE ASC LIMIT 20`).all(),
        env.DB.prepare(`SELECT s.user_id, s.username, ${stageScore} AS score
          FROM dandys_heroes_saves s WHERE ${namedPlayer}
          ORDER BY score DESC, s.username COLLATE NOCASE ASC LIMIT 20`).all(),
        env.DB.prepare(`SELECT s.user_id, s.username,
          MIN(MAX(CAST(json_extract(s.save_json, '$.arena.wins') AS INTEGER), 0), 100000000) AS score
          FROM dandys_heroes_saves s WHERE ${namedPlayer}
          ORDER BY score DESC, s.username COLLATE NOCASE ASC LIMIT 20`).all(),
        env.DB.prepare(`SELECT s.user_id, s.username,
          MIN(MAX(s.deepest_floor, 0), 100000000) AS score
          FROM dandys_heroes_saves s WHERE ${namedPlayer}
          ORDER BY score DESC, s.username COLLATE NOCASE ASC LIMIT 20`).all(),
        env.DB.prepare(`SELECT COUNT(*) AS count FROM dandys_heroes_saves s WHERE ${namedPlayer}`).first()
      ]);
      const viewerId = request.headers.get('x-websim-user-id');
      const players = rows => rows.results.map(row => ({
        username: cleanText(row.username, 64) || 'Player',
        score: Number(row.score) || 0,
        you: !!viewerId && row.user_id === viewerId
      }));
      return Response.json({
        toons: toonRows.results.map(row => ({ id: row.toon_id, score: Number(row.score) || 0 })),
        mastery: players(masteryRows),
        stages: players(stageRows).filter(row => row.score > 0),
        arena: players(arenaRows).filter(row => row.score > 0),
        floors: players(floorRows).filter(row => row.score > 0),
        playerCount: Number(playerCountRow && playerCountRow.count) || 0
      }, { headers: { 'cache-control': 'no-store' } });
    }

    if (url.pathname === '/api/arena/defenses') {
      await ensureArenaDefenseTable(env);
      await env.DB.exec(SAVE_TABLE);
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const viewerId = request.headers.get('x-websim-user-id');
      const select = `SELECT d.user_id, d.username, d.team_json, d.arena_rank, d.updated_at_ms,
        s.updated_at_ms AS save_updated_at_ms,
        CASE WHEN json_valid(s.save_json) THEN (
          SELECT json_group_object(t.id,
            json_extract(s.save_json, '$.heroes."' || t.id || '".costume'))
          FROM (SELECT json_extract(value, '$.id') AS id FROM json_each(d.team_json)) t
        ) ELSE NULL END AS live_costumes
        FROM arena_defenses d LEFT JOIN dandys_heroes_saves s ON s.user_id = d.user_id`;
      const query = viewerId
        ? env.DB.prepare(select + ' WHERE d.user_id != ? ORDER BY d.updated_at_ms DESC LIMIT 40').bind(viewerId)
        : env.DB.prepare(select + ' ORDER BY d.updated_at_ms DESC LIMIT 40');
      const { results } = await query.all();
      // The viewer's own published defense is returned separately so it never
      // shows up in (or vanishes from) the list of other players' teams.
      let mine = null;
      if (viewerId) {
        const own = await env.DB.prepare(select + ' WHERE d.user_id = ?').bind(viewerId).all();
        mine = own.results && own.results[0] ? parseDefense(own.results[0]) : null;
      }
      return Response.json({ defenses: results.map(parseDefense).filter(Boolean), mine, viewerId: viewerId || null },
        { headers: { 'cache-control': 'no-store' } });
    }

    if (url.pathname === '/api/arena/defense') {
      const userId = request.headers.get('x-websim-user-id');
      if (!userId) return jsonError('Sign in to publish a defense team', 401);
      if (request.method !== 'POST') return jsonError('Method not allowed', 405);
      let body;
      try { body = await request.json(); }
      catch (_) { return jsonError('Invalid JSON', 400); }
      if (body && body.saveKind === 'full-test') return jsonError('Full Test Save cannot publish a defense', 400);
      const team = cleanDefenseTeam(body && body.team);
      if (!team) return jsonError('Choose at least one Hero for your defense', 400);
      const resetCycle = await ensureArenaDefenseTable(env);
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

    // Dandy's Plush Challenge: best damage per player, per mode, per week.
    if (url.pathname === '/api/plush/score') {
      if (request.method !== 'POST') return jsonError('Method not allowed', 405);
      const userId = request.headers.get('x-websim-user-id');
      if (!userId || request.headers.get('x-websim-user-is-anonymous') === 'true') return jsonError('Sign in to join the weekly board', 401);
      let body;
      try { body = await request.json(); }
      catch (_) { return jsonError('Invalid JSON', 400); }
      const mode = body && body.mode;
      if (mode !== 'easy' && mode !== 'hard') return jsonError('Unknown mode', 400);
      const week = plushWeek();
      if (cleanNumber(body.week, -1, 1e6, -1) !== week) return jsonError('That week has already closed', 409);
      const score = Number(body.score);
      if (!Number.isSafeInteger(score) || score <= 0) return jsonError('Submit a valid score', 400);
      const username = cleanText(request.headers.get('x-websim-username') || 'Player', 64) || 'Player';
      await env.DB.exec(PLUSH_TABLE);
      await env.DB
        .prepare(
          'INSERT INTO plush_scores (user_id, username, mode, week, score, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON CONFLICT(user_id, mode, week) DO UPDATE SET username = excluded.username, ' +
          'score = MAX(plush_scores.score, excluded.score), updated_at_ms = excluded.updated_at_ms'
        )
        .bind(userId, username, mode, week, score, Date.now())
        .run();
      return Response.json({ ok: true });
    }

    if (url.pathname === '/api/plush/board') {
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const mode = url.searchParams.get('mode');
      if (mode !== 'easy' && mode !== 'hard') return jsonError('Unknown mode', 400);
      const week = cleanNumber(url.searchParams.get('week'), -1, 1e6, plushWeek());
      await env.DB.exec(PLUSH_TABLE);
      const viewerId = request.headers.get('x-websim-user-id');
      const [top, totalRow, mine] = await Promise.all([
        env.DB.prepare('SELECT user_id, username, score FROM plush_scores WHERE mode = ? AND week = ? ORDER BY score DESC, updated_at_ms ASC LIMIT 20').bind(mode, week).all(),
        env.DB.prepare('SELECT COUNT(*) AS n FROM plush_scores WHERE mode = ? AND week = ?').bind(mode, week).first(),
        viewerId ? env.DB.prepare('SELECT score FROM plush_scores WHERE user_id = ? AND mode = ? AND week = ?').bind(viewerId, mode, week).first() : Promise.resolve(null)
      ]);
      let you = null;
      if (mine && mine.score > 0) {
        const ahead = await env.DB.prepare('SELECT COUNT(*) AS n FROM plush_scores WHERE mode = ? AND week = ? AND score > ?').bind(mode, week, mine.score).first();
        you = { score: Number(mine.score) || 0, rank: (Number(ahead && ahead.n) || 0) + 1 };
      }
      return Response.json({
        week, mode, total: Number(totalRow && totalRow.n) || 0, you,
        top: top.results.map((row, i) => ({ rank: i + 1, username: cleanText(row.username, 64) || 'Player', score: Number(row.score) || 0, you: !!viewerId && row.user_id === viewerId }))
      }, { headers: { 'cache-control': 'no-store' } });
    }

    // Public picture-book profile: only the profile page fields and a few
    // headline stats are read from the player's cloud save.
    if (url.pathname === '/api/profile') {
      if (request.method !== 'GET') return jsonError('Method not allowed', 405);
      const name = cleanText(url.searchParams.get('u'), 64);
      if (!name) return jsonError('Username required', 400);
      await env.DB.exec(SAVE_TABLE);
      const row = await env.DB
        .prepare('SELECT user_id, username, save_json, mastery, heroes, deepest_floor FROM dandys_heroes_saves WHERE username = ? COLLATE NOCASE LIMIT 1')
        .bind(name).first();
      let save = null;
      try { save = row && JSON.parse(row.save_json); } catch (_) { save = null; }
      if (!save || isFullTestSave(save)) return Response.json({ profile: null, username: name }, { headers: { 'cache-control': 'no-store' } });
      const p = save.profile && typeof save.profile === 'object' ? save.profile : {};
      const book = p.book && typeof p.book === 'object' ? p.book : {};
      const ids = list => (Array.isArray(list) ? list : []).filter(id => typeof id === 'string').map(id => id.slice(0, 64));
      const favorites = ids(p.favorites && p.favorites.heroes).slice(0, 6);
      const feature = typeof book.feature === 'string' ? book.feature.slice(0, 64) : '';
      const toons = {};
      [feature, ...favorites].forEach(id => {
        const h = id && save.heroes && save.heroes[id];
        if (h && typeof h === 'object') toons[id] = { level: cleanNumber(h.level, 1, 9999, 1), rarity: cleanNumber(h.rarity, 1, 6, 1), costume: typeof h.costume === 'string' ? h.costume.slice(0, 64) : null };
      });
      const stickers = (Array.isArray(book.stickers) ? book.stickers : []).slice(0, 12).map(s => s && typeof s === 'object' ? {
        p: cleanNumber(s.p, 0, 9, 0), k: cleanText(s.k, 2), v: cleanText(s.v, 64),
        x: cleanNumber(s.x, 0, 100, 50), y: cleanNumber(s.y, 0, 100, 50), r: cleanNumber(s.r, -180, 180, 0), s: cleanNumber(s.s, 40, 260, 100)
      } : null).filter(Boolean);
      return Response.json({
        username: cleanText(row.username, 64) || name,
        you: request.headers.get('x-websim-user-id') === row.user_id,
        profile: {
          name: cleanText(p.name, 24),
          tagline: cleanText(p.tagline, 90),
          icon: p.icon && typeof p.icon === 'object' ? { kind: cleanText(p.icon.kind, 16), id: cleanText(p.icon.id, 64) } : null,
          favorites: { heroes: favorites },
          featuredAchievements: ids(p.featuredAchievements).slice(0, 3),
          book: {
            theme: cleanText(book.theme, 32), banner: cleanText(book.banner, 32), bg: cleanText(book.bg, 32),
            music: cleanText(book.music, 48), title: cleanText(book.title, 72), feature,
            favTwisted: cleanText(book.favTwisted, 64), favTrinket: cleanText(book.favTrinket, 64),
            panel: book.panel === 'stickers' ? 'stickers' : 'stats',
            sheet: ids(book.sheet).slice(0, 6), stickers
          }
        },
        toons,
        stats: {
          mastery: cleanNumber(row.mastery, 0, 100000, 0),
          heroes: cleanNumber(row.heroes, 0, 100000, 0),
          bestFloor: cleanNumber(row.deepest_floor, 0, 100000000, 0),
          arenaWins: cleanNumber(save.arena && save.arena.wins, 0, 100000000, 0)
        }
      }, { headers: { 'cache-control': 'no-store' } });
    }

    if (url.pathname !== '/api/save') return new Response('Not found', { status: 404 });

    const userId = request.headers.get('x-websim-user-id');
    if (!userId || request.headers.get('x-websim-user-is-anonymous') === 'true') return jsonError('Sign in to use cloud saves', 401);

    if (request.method === 'GET') {
      await env.DB.exec(SAVE_TABLE);
      const row = await env.DB
        .prepare('SELECT username, save_json, mastery, heroes, deepest_floor, updated_at_ms FROM dandys_heroes_saves WHERE user_id = ?')
        .bind(userId)
        .first();
      return Response.json({ save: row || null }, { headers: { 'cache-control': 'no-store' } });
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
    if (isFullTestSave(save) || (save._saveKind && save._saveKind !== 'main')) {
      return jsonError('Full Test Save cannot be stored in the cloud', 400);
    }
    const baseAt = Number(body && body.base_updated_at_ms);
    if (!Number.isSafeInteger(baseAt) || baseAt < 0) return jsonError('Cloud save revision is required', 400);

    const saveJson = JSON.stringify(save);
    // D1 rows top out at 2 MB; stay under that with headroom.
    if (saveJson.length > 1500000) return jsonError('Save is too large', 413);
    if (!save.heroes || !save.res || typeof save.heroes !== 'object' || typeof save.res !== 'object') {
      return jsonError('Save is missing required data', 400);
    }

    await env.DB.exec(SAVE_TABLE);

    const username = request.headers.get('x-websim-username') || '';
    const mastery = Number.isFinite(Number(save.mastery)) ? Math.max(0, Math.floor(Number(save.mastery))) : 0;
    const heroes = Object.keys(save.heroes).length;
    const deepestFloor = Number.isFinite(Number(save.bestFloor)) ? Math.max(0, Math.floor(Number(save.bestFloor))) : 0;
    // A write must name the exact cloud revision it was based on. This is
    // independent of the player's device clock and guards the write itself,
    // so simultaneous tabs cannot both replace one another.
    const existing = await env.DB
      .prepare('SELECT save_json, mastery, heroes, deepest_floor, updated_at_ms, username FROM dandys_heroes_saves WHERE user_id = ?')
      .bind(userId)
      .first();
    if ((Number(existing && existing.updated_at_ms) || 0) !== baseAt) {
      return Response.json({
        error: 'Cloud save changed on another device',
        save: existing
      }, { status: 409 });
    }
    const updatedAt = Math.max(Date.now(), baseAt + 1);
    const write = await env.DB
      .prepare(
        'INSERT INTO dandys_heroes_saves (user_id, username, save_json, mastery, heroes, deepest_floor, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(user_id) DO UPDATE SET username = excluded.username, save_json = excluded.save_json, mastery = excluded.mastery, heroes = excluded.heroes, deepest_floor = excluded.deepest_floor, updated_at_ms = excluded.updated_at_ms ' +
        'WHERE dandys_heroes_saves.updated_at_ms = ?'
      )
      .bind(userId, username, saveJson, mastery, heroes, deepestFloor, updatedAt, baseAt)
      .run();
    if (!write.meta || Number(write.meta.changes) !== 1) {
      const latest = await env.DB
        .prepare('SELECT save_json, mastery, heroes, deepest_floor, updated_at_ms, username FROM dandys_heroes_saves WHERE user_id = ?')
        .bind(userId)
        .first();
      return Response.json({ error: 'Cloud save changed on another device', save: latest }, { status: 409 });
    }

    return Response.json({
      ok: true,
      save: { username, save_json: saveJson, mastery, heroes, deepest_floor: deepestFloor, updated_at_ms: updatedAt }
    });
  }
};
