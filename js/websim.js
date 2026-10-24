/* websim.js - Websim identity and account-bound cloud saves. */
'use strict';

function profileIconVisual(selection) {
  selection = selection || {};
  if (selection.kind === 'hero' && HEROES[selection.id] && Save.owns(selection.id)) {
    return { src: Art.icon(selection.id), label: HEROES[selection.id].name };
  }
  if (selection.kind === 'trinket' && TRINKETS[selection.id] && Save.ownsTrinket(selection.id)) {
    return { src: trinketIcon(selection.id), label: TRINKETS[selection.id].name };
  }
  if (selection.kind === 'badge' && BADGES[selection.id] && Save.data.badges[selection.id]) {
    return { text: BADGES[selection.id].icon, label: BADGES[selection.id].name };
  }
  const shopIcons = {
    dandy: { src: ASSET + 'uploads/dandyhimself.webp', label: 'Dandy' },
    buds: { src: ASSET + 'uploads/dandysbudicon.png', label: "Dandy's Buds" },
    journal: { text: '📖', label: 'Journal' },
    ichor: { src: ASSET + 'uploads/ichor.png', label: 'Black Ichor' },
    'achievement-sprout-pose': { src: ASSET + 'uploads/sproutposeicon.png', label: 'That Pose Again' },
    'achievement-baldifer': { src: ASSET + 'uploads/baldicon.png', label: 'Baldifer Baldicus' },
    'achievement-yatta-blot': { src: ASSET + 'uploads/image-59.png', label: "It's Just a Phase, Mom." }
  };
  if (selection.kind === 'shop' && Save.data.profile && (Save.data.profile.iconUnlocks || []).includes(selection.id) && shopIcons[selection.id]) return shopIcons[selection.id];
  const fallback = Save.data.team && Save.data.team.find(id => Save.owns(id));
  return fallback ? { src: Art.icon(fallback), label: HEROES[fallback].name } : { text: '🎭', label: 'Dandy’s Heroes' };
}

function mountProfileIcon(parent, selection, className) {
  clear(parent);
  const visual = profileIconVisual(selection);
  if (visual.src) {
    const img = el('img'); img.src = visual.src; img.alt = visual.label; parent.appendChild(img);
  } else parent.textContent = visual.text;
  if (className) parent.classList.add(className);
  return visual;
}

async function profileAssetDataUrl(src) {
  const response = await fetch(src);
  if (!response.ok) throw new Error('profile asset returned ' + response.status);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function profileCardImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function profileCardRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function profileCardContain(ctx, image, x, y, width, height, padding = 0) {
  const scale = Math.min((width - padding * 2) / image.width, (height - padding * 2) / image.height);
  const w = image.width * scale, h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function profileCardStar(ctx, x, y, outer, inner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 ? inner : outer, angle = -Math.PI / 2 + i * Math.PI / points;
    const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

async function createProfileCardImage(profile, name, favoriteIds, visual) {
  // This is deliberately a local canvas export. It does not call an AI image
  // service or publish anything; the player gets a PNG they can save and post
  // wherever they want.
  const width = 1080, height = 1350;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const backdrop = ctx.createLinearGradient(0, 0, width, height);
  backdrop.addColorStop(0, '#213f3d'); backdrop.addColorStop(.45, '#162827'); backdrop.addColorStop(1, '#10171e');
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(260, 270, 20, 260, 270, 560);
  glow.addColorStop(0, '#b9ed7955'); glow.addColorStop(1, '#b9ed7900');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.globalAlpha = .16; ctx.strokeStyle = '#dfff9d'; ctx.lineWidth = 3;
  for (let x = -height; x < width + height; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + height, height); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#dfff9d';
  [[88, 208, 10], [948, 230, 7], [906, 630, 12], [120, 720, 6], [820, 110, 5]].forEach(([x, y, r]) => profileCardStar(ctx, x, y, r, r * .35));
  ctx.fillStyle = '#f7df83';
  [[150, 350, 7], [920, 440, 8], [78, 1000, 5]].forEach(([x, y, r]) => profileCardStar(ctx, x, y, r, r * .35, 4));
  profileCardRoundRect(ctx, 38, 38, width - 76, height - 76, 30);
  ctx.strokeStyle = '#dfff9d66'; ctx.lineWidth = 4; ctx.stroke();

  let icon = null;
  if (visual.src) {
    try { icon = await profileCardImage(await profileAssetDataUrl(visual.src)); } catch (_) { /* keep the frame usable */ }
  }
  profileCardRoundRect(ctx, 175, 155, 730, 555, 48);
  ctx.fillStyle = '#0b1718aa'; ctx.fill();
  ctx.strokeStyle = '#b8e87899'; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.arc(540, 428, 242, 0, Math.PI * 2); ctx.fillStyle = '#3e6b5b'; ctx.fill();
  ctx.strokeStyle = '#eaff9a'; ctx.lineWidth = 10; ctx.stroke();
  if (icon) {
    ctx.save(); ctx.beginPath(); ctx.arc(540, 428, 220, 0, Math.PI * 2); ctx.clip();
    profileCardContain(ctx, icon, 320, 208, 440, 440, 18); ctx.restore();
  } else {
    ctx.fillStyle = '#eaff9a'; ctx.font = '900 76px Arial'; ctx.textAlign = 'center';
    ctx.fillText(visual.text || '🎭', 540, 455); ctx.textAlign = 'left';
  }

  const gradient = ctx.createLinearGradient(0, height * .36, 0, height);
  gradient.addColorStop(0, '#07151608'); gradient.addColorStop(.45, '#071516c4'); gradient.addColorStop(1, '#071516f5');
  ctx.fillStyle = gradient; ctx.fillRect(0, height * .36, width, height * .64);

  ctx.fillStyle = '#eaff9a'; ctx.font = '900 30px Arial';
  ctx.fillText("DANDY'S HEROES", 70, 86);
  ctx.fillStyle = '#ffffffcc'; ctx.font = '700 19px Arial';
  ctx.fillText('JOURNAL PROFILE CARD', 72, 120);

  const badgeX = width - 164, badgeY = 68;
  ctx.beginPath(); ctx.arc(badgeX, badgeY, 62, 0, Math.PI * 2); ctx.fillStyle = '#eaff9a'; ctx.fill();
  ctx.strokeStyle = '#10241d'; ctx.lineWidth = 8; ctx.stroke();
  try {
    if (icon) {
      ctx.save(); ctx.beginPath(); ctx.arc(badgeX, badgeY, 52, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(icon, badgeX - 52, badgeY - 52, 104, 104); ctx.restore();
    } else {
      ctx.fillStyle = '#17372b'; ctx.font = '900 42px Arial'; ctx.textAlign = 'center'; ctx.fillText(visual.text || '🎭', badgeX, badgeY + 15); ctx.textAlign = 'left';
    }
  } catch (_) { /* keep the badge as a clean accent */ }

  ctx.fillStyle = '#fff7d1'; ctx.font = '900 70px Arial';
  ctx.fillText(String(name || 'Player').slice(0, 22), 70, 760);
  ctx.fillStyle = '#d4e9d4'; ctx.font = '700 24px Arial';
  const tagline = String(profile.tagline || '').replace(/[<>]/g, '').trim().slice(0, 90);
  ctx.fillText((tagline || 'A small identity card from Gardenview').slice(0, 58), 74, 805);

  const stats = [
    ['MASTERY', fmt(Save.data.mastery || 0)],
    ['HEROES', fmt(Save.ownedIds().length)],
    ['BEST FLOOR', fmt(Save.data.bestFloor || 0)]
  ];
  stats.forEach(([label, value], index) => {
    const x = 72 + index * 290;
    ctx.fillStyle = '#dfff9d22'; ctx.fillRect(x, 850, 250, 92);
    ctx.strokeStyle = '#dfff9d66'; ctx.lineWidth = 2; ctx.strokeRect(x, 850, 250, 92);
    ctx.fillStyle = '#eaff9a'; ctx.font = '900 18px Arial'; ctx.fillText(label, x + 18, 878);
    ctx.fillStyle = '#fff7d1'; ctx.font = '900 34px Arial'; ctx.fillText(value, x + 18, 920);
  });

  ctx.fillStyle = '#ffffffcc'; ctx.font = '900 19px Arial'; ctx.fillText('FAVORITE HEROES', 72, 1005);
  const heroImages = await Promise.all(favoriteIds.slice(0, 5).map(async id => {
    try { return [id, await profileCardImage(await profileAssetDataUrl(Art.icon(id)))]; } catch (_) { return [id, null]; }
  }));
  if (!heroImages.length) {
    ctx.fillStyle = '#c9d9ce'; ctx.font = '700 22px Arial'; ctx.fillText('Choose up to five favorites in your profile.', 72, 1055);
  } else {
    heroImages.forEach(([id, image], index) => {
      const x = 72 + index * 190;
      ctx.fillStyle = '#efffb533'; ctx.fillRect(x, 1032, 160, 205);
      if (image) ctx.drawImage(image, x + 15, 1045, 130, 130);
      ctx.fillStyle = '#fff7d1'; ctx.font = '900 17px Arial';
      ctx.fillText(String(HEROES[id] ? HEROES[id].name : id).slice(0, 16), x + 12, 1205);
    });
  }
  const featured = (profile.featuredAchievements || []).map(id => typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean).slice(0, 3);
  if (featured.length) {
    ctx.fillStyle = '#ffffffcc'; ctx.font = '900 17px Arial'; ctx.fillText('FEATURED ACHIEVEMENTS', 72, 1260);
    ctx.fillStyle = '#ffe99b'; ctx.font = '700 16px Arial';
    ctx.fillText(featured.map(a => `${a.tier === 'iridescent' ? '🌈' : '🏆'} ${a.title}`).join('  ·  ').slice(0, 82), 72, 1287);
  }
  ctx.fillStyle = '#dfff9d'; ctx.font = '700 18px Arial'; ctx.fillText('DANDYS-HEROES · PROFILE CARD', 72, 1322);

  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('card export failed')), 'image/png', .94));
  return { blob, dataUrl: canvas.toDataURL('image/png') };
}

const WebsimAccount = {
  user: null,
  cloud: null,
  profilePage: 'identity',
  started: false,
  loading: null,
  identityRetryTimer: null,
  identityRetries: 0,
  profileBody: null,
  syncing: false,
  pendingSync: false,
  syncTimer: null,
  refreshTimer: null,
  uploadInFlight: null,
  retryDelay: 3000,
  refreshRetryDelay: 5000,
  suppressAutosave: false,
  cloudError: null,
  cloudConflict: false,
  invalidCloud: false,
  eventsBound: false,

  cloudEligible() {
    return !!this.user && typeof Save !== 'undefined' && Save.isAccountSave();
  },

  baseKey() { return this.user ? 'dandys-heroes-cloud-base-v1-' + this.user.id : ''; },
  baseAt() {
    try { return Number(localStorage.getItem(this.baseKey())) || 0; }
    catch (_) { return 0; }
  },
  setBaseAt(at) {
    if (!this.user || !Number.isSafeInteger(Number(at)) || Number(at) < 0) return;
    try { localStorage.setItem(this.baseKey(), String(at)); }
    catch (err) { console.warn('Cloud revision could not be cached locally', err); }
  },
  sameProgress(cloud) {
    if (!cloud || !cloud.save_json) return false;
    try {
      const remote = JSON.parse(cloud.save_json);
      const local = Object.assign({}, Save.data);
      delete remote._updatedAt;
      delete local._updatedAt;
      return JSON.stringify(remote) === JSON.stringify(local);
    } catch (_) { return false; }
  },

  init() {
    const button = $('#accountBtn');
    if (button) button.onclick = () => this.open();
    if (!this.eventsBound) {
      const flush = () => {
        if (this.pendingSync && this.cloudEligible()) this.upload({ silent: true, keepalive: true });
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
        else if (!this.user) this.start();
      });
      window.addEventListener('pagehide', flush);
      window.addEventListener('focus', () => { if (!this.user) this.start(); });
      this.eventsBound = true;
    }
    return this.start().then(() => this.drawButton());
  },

  async lookupUser() {
    const probes = [];
    if (window.websim && typeof window.websim.getUser === 'function') {
      probes.push((async () => {
        let timeout;
        try {
          const user = await Promise.race([
            window.websim.getUser(),
            new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('account lookup timed out')), 6000); })
          ]);
          if (!user || !user.id || !user.username) throw new Error('No browser account');
          return user;
        } finally { clearTimeout(timeout); }
      })());
    }
    probes.push((async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = setTimeout(() => controller && controller.abort(), 6000);
      try {
        const response = await fetch('/api/account', {
          cache: 'no-store',
          ...(controller ? { signal: controller.signal } : {})
        });
        if (!response.ok) throw new Error('account endpoint returned ' + response.status);
        const { user } = await response.json();
        if (!user || !user.id || !user.username) throw new Error('No backend account');
        return user;
      } finally { clearTimeout(timeout); }
    })());
    try { return await Promise.any(probes); }
    catch (_) { return null; }
  },

  scheduleIdentityRetry() {
    clearTimeout(this.identityRetryTimer);
    if (this.user) return;
    const delay = [1500, 5000, 15000][this.identityRetries++] || 30000;
    this.identityRetryTimer = setTimeout(() => {
      this.identityRetryTimer = null;
      this.start();
    }, delay);
  },

  async start() {
    if (this.loading) return this.loading;
    if (this.user) return;
    this.loading = (async () => {
      this.syncing = true;
      try {
        this.user = await this.lookupUser();
        if (this.user) {
          clearTimeout(this.identityRetryTimer);
          this.identityRetryTimer = null;
          this.identityRetries = 0;
          if (this.cloudEligible()) {
            await this.refreshCloud();
            this.reconcileCloud();
          } else this.pendingSync = false;
        }
      } catch (err) {
        console.warn('Websim account unavailable', err);
      } finally {
        this.started = true;
        this.syncing = false;
        if (this.pendingSync && this.cloudEligible()) this.scheduleUpload(350);
        if (this.cloudError && this.cloudEligible()) this.scheduleCloudRefresh();
        this.drawButton();
        if (this.profileBody && this.profileBody.isConnected && this.profilePage === 'save') this.draw(this.profileBody);
      }
    })().finally(() => {
      this.loading = null;
      if (!this.user) this.scheduleIdentityRetry();
    });
    return this.loading;
  },

  scheduleCloudRefresh(delay = this.refreshRetryDelay) {
    clearTimeout(this.refreshTimer);
    if (!this.cloudEligible()) return;
    this.refreshTimer = setTimeout(async () => {
      this.refreshTimer = null;
      if (!this.cloudEligible()) return;
      await this.refreshCloud();
      if (this.cloudError) {
        this.refreshRetryDelay = Math.min(this.refreshRetryDelay * 2, 60000);
        this.scheduleCloudRefresh(this.refreshRetryDelay);
        return;
      }
      this.refreshRetryDelay = 5000;
      this.reconcileCloud();
      if (this.pendingSync && this.cloudEligible()) this.scheduleUpload(350);
    }, delay);
  },

  async refreshCloud() {
    if (!this.cloudEligible()) return;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = setTimeout(() => controller && controller.abort(), 7000);
    try {
      const response = await fetch('/api/save', {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error('cloud lookup returned ' + response.status);
      const body = await response.json();
      this.cloud = body.save || null;
      this.invalidCloud = false;
      // A previous build could have accidentally put the local Full Test Save
      // in the account row. Never offer that fixture back as the player's
      // cloud save; reconcileCloud will replace it with Main Save instead.
      if (this.cloud && this.cloud.save_json) {
        try {
          const cloudData = JSON.parse(this.cloud.save_json);
          if (Save.isTestData(cloudData)) this.invalidCloud = true;
        } catch (_) { /* reconcileCloud will report an invalid cloud copy */ }
      }
      this.cloudError = null;
      this.refreshRetryDelay = 5000;
    } catch (err) {
      console.warn('Cloud save lookup failed', err);
      this.cloudError = err;
      // Keep the last known revision so a temporary GET failure cannot make
      // the next write look like a brand-new cloud save.
    } finally {
      clearTimeout(timeout);
    }
  },

  adoptCloud(cloud) {
    if (!this.cloudEligible() || !cloud || !cloud.save_json) return false;
    try {
      const cloudData = JSON.parse(cloud.save_json);
      if (Save.isTestData(cloudData)) return false;
      this.suppressAutosave = true;
      if (!Save.import(cloud.save_json, { skipCloud: true, touch: false })) return false;
      Save.data._updatedAt = Number(cloud.updated_at_ms) || Date.now();
      Save.write({ skipCloud: true, touch: false });
      this.cloud = cloud;
      this.pendingSync = false;
      this.cloudConflict = false;
      this.setBaseAt(Number(cloud.updated_at_ms) || 0);
      return true;
    } catch (err) {
      console.warn('Cloud save restore failed', err);
      return false;
    } finally {
      this.suppressAutosave = false;
    }
  },

  reconcileCloud() {
    if (!this.cloudEligible()) { this.pendingSync = false; return; }
    // Never treat a failed lookup as an empty account.
    if (this.cloudError) {
      this.pendingSync = false;
      return;
    }
    const localAt = Number(Save.data && Save.data._updatedAt) || 0;
    const cloudAt = Number(this.cloud && this.cloud.updated_at_ms) || 0;
    const baseAt = this.baseAt();

    // Older builds could leak Full Test Save into the account row. Replace
    // that invalid row using its real revision instead of assuming no row.
    if (this.invalidCloud && this.cloud) {
      this.setBaseAt(cloudAt);
      this.cloudConflict = false;
      this.pendingSync = true;
      return;
    }

    if (!this.cloud) {
      this.cloudConflict = false;
      this.pendingSync = true;
      return;
    }
    if (this.sameProgress(this.cloud)) {
      this.cloudConflict = false;
      this.pendingSync = false;
      this.setBaseAt(cloudAt);
      if (localAt !== cloudAt) {
        Save.data._updatedAt = cloudAt;
        Save.write({ skipCloud: true, touch: false });
      }
      return;
    }
    // A clean local copy can follow an update from another device. A fresh
    // local save can also safely load an existing cloud save.
    if (localAt === 0 || (baseAt > 0 && localAt <= baseAt && cloudAt > baseAt)) {
      if (this.adoptCloud(this.cloud)) return;
    }
    if ((baseAt > 0 && cloudAt === baseAt) || (baseAt === 0 && cloudAt === localAt && cloudAt > 0)) {
      this.cloudConflict = false;
      this.pendingSync = true;
      if (!baseAt) this.setBaseAt(cloudAt);
      return;
    }
    // Both copies changed since the last shared revision. Keep the local
    // autosave intact and let the player choose which one to keep.
    this.cloudConflict = true;
    this.pendingSync = false;
  },

  noteLocalChange() {
    if (!this.cloudEligible() || this.suppressAutosave) return;
    this.pendingSync = true;
    this.retryDelay = 3000;
    if (this.cloudError) { this.scheduleCloudRefresh(); return; }
    if (this.cloudConflict) return;
    if (!this.started || this.syncing) return;
    this.scheduleUpload();
  },

  scheduleUpload(delay = 900) {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      if (this.pendingSync) this.upload({ silent: true });
    }, delay);
  },

  async upload({ silent = false, keepalive = false, force = false } = {}) {
    if (!this.cloudEligible()) return false;
    if (this.cloudError) { this.scheduleCloudRefresh(0); return false; }
    if (this.cloudConflict && !force) return false;
    if (this.uploadInFlight) return this.uploadInFlight;

    const snapshotJson = JSON.stringify(Save.data);
    const snapshot = JSON.parse(snapshotJson);
    const baseAt = Number(this.cloud && this.cloud.updated_at_ms) || 0;
    const requestBody = JSON.stringify({ save: snapshot, base_updated_at_ms: baseAt });
    this.uploadInFlight = (async () => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = setTimeout(() => controller && controller.abort(), 10000);
      try {
        const response = await fetch('/api/save', {
          method: 'PUT',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: requestBody,
          keepalive: keepalive && requestBody.length <= 60000,
          ...(controller ? { signal: controller.signal } : {})
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 409 && Object.prototype.hasOwnProperty.call(body, 'save')) {
            this.cloud = body.save || null;
            this.cloudError = null;
            this.reconcileCloud();
            if (this.pendingSync && !this.cloudConflict) this.scheduleUpload(350);
            if (!silent) UI.toast(this.cloudConflict ? 'Cloud changed elsewhere. Local save kept.' : 'Cloud save refreshed');
            if (this.profileBody && this.profileBody.isConnected && this.profilePage === 'save') this.draw(this.profileBody);
            return false;
          }
          throw new Error(body.error || ('cloud upload returned ' + response.status));
        }
        this.cloud = body.save || null;
        this.cloudError = null;
        this.cloudConflict = false;
        this.invalidCloud = false;
        this.retryDelay = 3000;
        if (this.cloud) this.setBaseAt(Number(this.cloud.updated_at_ms) || 0);

        // Preserve a newer local edit made while the request was in flight.
        if (JSON.stringify(Save.data) === snapshotJson && this.cloud) {
          this.pendingSync = false;
          this.suppressAutosave = true;
          Save.data._updatedAt = Number(this.cloud.updated_at_ms) || Save.data._updatedAt;
          Save.write({ skipCloud: true, touch: false });
          this.suppressAutosave = false;
        } else {
          this.pendingSync = true;
          // The cloud revision may be ahead of this device's clock. Keep the
          // newer in-flight local edit visibly newer than its cloud base.
          if (this.cloud) {
            Save.data._updatedAt = Math.max(Number(Save.data._updatedAt) || 0, Number(this.cloud.updated_at_ms) + 1);
            Save.write({ skipCloud: true, touch: false });
          }
          this.scheduleUpload(350);
        }
        if (this.profileBody && this.profileBody.isConnected && this.profilePage === 'save') this.draw(this.profileBody);
        if (!silent) { Sound.play('ui_ok'); UI.toast('Cloud save updated'); }
        return true;
      } catch (err) {
        console.warn('Cloud save upload failed', err);
        this.cloudError = err;
        // Keep the local save and retry after the cloud can be read again.
        this.pendingSync = true;
        if (this.cloudEligible()) {
          this.scheduleCloudRefresh(this.retryDelay);
          this.retryDelay = Math.min(this.retryDelay * 2, 30000);
        }
        if (this.profileBody && this.profileBody.isConnected && this.profilePage === 'save') this.draw(this.profileBody);
        if (!silent) { Sound.play('ui_err'); UI.toast('Cloud save failed'); }
        return false;
      } finally {
        clearTimeout(timeout);
        this.uploadInFlight = null;
      }
    })();
    return this.uploadInFlight;
  },

  drawButton() {
    const button = $('#accountBtn');
    if (!button) return;
    const avatar = $('.profile-avatar', button), label = $('.profile-label', button);
    const profile = Save.data.profile || {};
    mountProfileIcon(avatar, profile.icon, 'profile-avatar');
    label.textContent = Save.isTestSession() ? 'Full Test Save' : profile.name || (this.user ? '@' + this.user.username : 'Profile');
    button.title = this.user ? 'Open your Dandy\'s Heroes profile' : 'Customize your local Dandy\'s Heroes profile';
  },

  async open() {
    const body = el('div');
    this.profileBody = body;
    body.appendChild(el('div', 'tiny muted', 'Connecting to your Websim account…'));
    UI.modal('Dandy Profile', body, { className: 'profile-modal' });
    await this.start();
    if (!body.isConnected) return;
    this.draw(body);
  },

  async postProfile(button) {
    const profile = Save.data.profile || {}, fav = profile.favorites || {};
    const name = profile.name || (Save.isTestSession() ? 'Full Test Save' : this.user ? '@' + this.user.username : 'Player');

    if (button) { button.disabled = true; button.textContent = 'MAKING IMAGE…'; }
    try {
      const card = await createProfileCardImage(profile, name,
        (fav.heroes || []).filter(id => HEROES[id] && Save.owns(id)), profileIconVisual(profile.icon));
      this.showProfileCard(card);
    } catch (err) {
      console.warn('Profile card export failed', err);
      UI.toast('Could not make the profile image'); Sound.play('ui_err');
    }
    finally { if (button) { button.disabled = false; button.textContent = '✦ MAKE IMAGE CARD'; } }
  },

  showProfileCard(card) {
    const body = el('div', 'profile-card-body');
    body.innerHTML = '<p class="profile-card-note">Your image card is ready. Save it, then post the PNG anywhere you like.</p>';
    const image = el('img', 'profile-card-image');
    image.src = card.dataUrl; image.alt = 'Dandy\'s Heroes profile card';
    body.appendChild(image);
    const actions = el('div', 'profile-card-actions');
    const save = el('button', 'btn gold grow', '↓ SAVE IMAGE');
    save.onclick = () => {
      const url = URL.createObjectURL(card.blob), link = document.createElement('a');
      link.href = url; link.download = 'dandys-profile-card.png'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      UI.toast('Profile card saved'); Sound.play('get_item');
    };
    actions.append(save); body.appendChild(actions);
    UI.modal('Your Profile Card', body, { className: 'profile-card-modal' });
  },

  draw(body) {
    clear(body);
    const profile = Save.data.profile;
    profile.tagline = String(profile.tagline || '').replace(/[<>]/g, '').trim().slice(0, 90);
    profile.favorites = profile.favorites || { heroes: [] };
    if (!Array.isArray(profile.favorites.heroes)) profile.favorites.heroes = [];
    profile.featuredAchievements = Array.isArray(profile.featuredAchievements) ? profile.featuredAchievements : [];
    profile.featuredAchievements = profile.featuredAchievements
      .filter(id => typeof ACHIEVEMENTS !== 'undefined' && ACHIEVEMENTS.some(a => a.id === id && Achievements.isUnlocked(a.id))).slice(0, 3);
    const fallbackName = Save.isTestSession() ? 'Full Test Save' : this.user ? '@' + this.user.username : 'Player';
    const shell = el('div', 'profile-shell');
    const head = el('section', 'profile-head');
    const headIcon = el('div', 'profile-head-avatar'); mountProfileIcon(headIcon, profile.icon);
    const headCopy = el('div', 'profile-head-copy');
    headCopy.innerHTML = '<small>DANDY\'S HEROES PROFILE</small>';
    const headName = el('b', '', profile.name || fallbackName); headCopy.appendChild(headName);
    headCopy.appendChild(el('span', '', profile.tagline || 'A small identity card for your Journal.'));
    head.appendChild(headIcon); head.appendChild(headCopy); shell.appendChild(head);

    const pageIds = ['identity', 'icon', 'heroes', 'achievements', 'save'];
    const pageLabels = { identity: 'Identity', icon: 'Icon', heroes: 'Heroes', achievements: 'Awards', save: 'Save' };
    if (!pageIds.includes(this.profilePage)) this.profilePage = 'identity';
    const tabs = el('nav', 'profile-page-tabs');
    pageIds.forEach(id => {
      const tab = el('button', 'profile-page-tab' + (this.profilePage === id ? ' active' : ''), pageLabels[id]);
      tab.type = 'button'; tab.onclick = () => { this.profilePage = id; this.draw(body); };
      tabs.appendChild(tab);
    });
    shell.appendChild(tabs);
    const page = el('section', 'profile-page');
    shell.appendChild(page);

    const addChoiceSection = (parent, title, note, choices, selectedFn, clickFn, cls) => {
      const section = el('section', 'profile-section');
      const header = el('header'); header.appendChild(el('b', '', title)); header.appendChild(el('small', '', note)); section.appendChild(header);
      const grid = el('div', 'profile-choice-grid');
      choices.forEach(choice => {
        const button = el('button', 'profile-choice ' + (cls || ''));
        button.type = 'button';
        const visual = profileIconVisual(choice);
        if (visual.src) { const img = el('img'); img.src = visual.src; img.alt = visual.label; button.appendChild(img); }
        else button.appendChild(el('b', '', visual.text));
        button.appendChild(el('span', '', visual.label));
        if (selectedFn(choice)) button.classList.add('selected');
        button.onclick = () => clickFn(choice);
        grid.appendChild(button);
      });
      if (!choices.length) grid.appendChild(el('div', 'profile-section-note', 'Nothing discovered yet. Keep playing to add choices here.'));
      section.appendChild(grid); parent.appendChild(section);
    };

    const iconChoices = [
      ...(profile.iconUnlocks || []).map(id => ({ kind: 'shop', id })),
      ...Save.ownedIds().map(id => ({ kind: 'hero', id })),
      ...TRINKET_IDS.filter(id => Save.ownsTrinket(id)).map(id => ({ kind: 'trinket', id })),
      ...Object.keys(Save.data.badges || {}).filter(id => BADGES[id]).map(id => ({ kind: 'badge', id }))
    ];
    const toggleFavoriteHero = choice => {
      const list = profile.favorites.heroes;
      const at = list.indexOf(choice.id);
      if (at >= 0) list.splice(at, 1);
      else if (list.length >= 5) { UI.toast('Choose up to 5 favorites'); Sound.play('ui_err'); return; }
      else list.push(choice.id);
      Save.write(); this.draw(body);
    };
    if (this.profilePage === 'identity') {
      const intro = el('div', 'profile-page-intro');
      intro.innerHTML = '<b>Your identity</b><span>Choose a name for your Journal card.</span>';
      page.appendChild(intro);
      const nameSection = el('section', 'profile-section');
      nameSection.innerHTML = '<header><b>Display name</b><small>JOURNAL CARD</small></header>';
      const nameInput = el('input', 'profile-name-input');
      nameInput.type = 'text'; nameInput.maxLength = 24; nameInput.placeholder = fallbackName; nameInput.value = profile.name || '';
      nameInput.oninput = () => { headName.textContent = nameInput.value.trim() || fallbackName; };
      nameInput.onchange = () => { profile.name = nameInput.value.replace(/[<>]/g, '').trim().slice(0, 24); nameInput.value = profile.name; Save.write(); this.drawButton(); this.draw(body); };
      nameSection.appendChild(nameInput); page.appendChild(nameSection);

      const taglineSection = el('section', 'profile-section');
      taglineSection.innerHTML = '<header><b>Tagline</b><small>PROFILE CARD · 90 CHARACTERS</small></header>';
      const taglineInput = el('textarea', 'profile-tagline-input');
      taglineInput.maxLength = 90; taglineInput.rows = 2; taglineInput.placeholder = 'A tiny motto, warning, or favorite quote…'; taglineInput.value = profile.tagline;
      taglineInput.oninput = () => { headCopy.querySelector('span').textContent = taglineInput.value.trim() || 'A small identity card for your Journal.'; };
      taglineInput.onchange = () => { profile.tagline = taglineInput.value.replace(/[<>]/g, '').trim().slice(0, 90); taglineInput.value = profile.tagline; Save.write(); this.draw(body); };
      taglineSection.appendChild(taglineInput); page.appendChild(taglineSection);

      const stats = el('div', 'account-stats');
      [[Save.data.mastery, 'MASTERY'], [Save.ownedIds().length, 'HEROES'], [Save.data.bestFloor, 'BEST FLOOR']].forEach(([value, label]) => {
        const stat = el('div', 'account-stat'); stat.innerHTML = `<b>${fmt(value)}</b><span>${label}</span>`; stats.appendChild(stat);
      });
      page.appendChild(stats);
      const profileActions = el('div', 'profile-actions');
      const post = el('button', 'btn pri', '✦ MAKE IMAGE CARD');
      post.onclick = () => this.postProfile(post);
      profileActions.appendChild(post); page.appendChild(profileActions);
    }

    if (this.profilePage === 'icon') {
      const intro = el('div', 'profile-page-intro');
      intro.innerHTML = '<b>Profile icon</b><span>Pick one portrait for your account card.</span>';
      page.appendChild(intro);
      addChoiceSection(page, 'Choose an icon', 'OWNED HEROES · TRINKETS · UNLOCKED ICONS', iconChoices,
        choice => profile.icon.kind === choice.kind && profile.icon.id === choice.id,
        choice => { profile.icon = { kind: choice.kind, id: choice.id }; Save.write(); this.drawButton(); this.draw(body); }, 'profile-icon-choice');
    }

    if (this.profilePage === 'heroes') {
      const intro = el('div', 'profile-page-intro');
      intro.innerHTML = `<b>Favorite Heroes <small>${profile.favorites.heroes.length} / 5</small></b><span>These are the only favorites shown on your image card.</span>`;
      page.appendChild(intro);
      addChoiceSection(page, 'Roster picks', 'UP TO 5 · IMAGE CARD', Save.ownedIds().map(id => ({ kind: 'hero', id })),
        choice => profile.favorites.heroes.includes(choice.id), toggleFavoriteHero);
    }

    if (this.profilePage === 'achievements') {
      const completed = typeof Achievements !== 'undefined' ? Achievements.completed() : [];
      const intro = el('div', 'profile-page-intro');
      intro.innerHTML = `<b>Featured achievements <small>${profile.featuredAchievements.length} / 3</small></b><span>Only completed milestones can be displayed.</span>`;
      page.appendChild(intro);
      const section = el('section', 'profile-section');
      section.innerHTML = '<header><b>Journal awards</b><small>IMAGE CARD · UP TO 3</small></header>';
      const grid = el('div', 'profile-achievement-grid');
      completed.forEach(a => {
        const button = el('button', 'profile-achievement-choice' + (profile.featuredAchievements.includes(a.id) ? ' selected' : ''));
        button.type = 'button';
        button.innerHTML = `<span class="profile-achievement-medal">${a.tier === 'iridescent' ? '🌈' : ACHIEVEMENT_TIERS[a.tier].icon}</span><span class="profile-achievement-copy"><b>${a.title}</b><small>${ACHIEVEMENT_TIERS[a.tier].label}</small></span>`;
        button.onclick = () => {
          const at = profile.featuredAchievements.indexOf(a.id);
          if (at >= 0) profile.featuredAchievements.splice(at, 1);
          else if (profile.featuredAchievements.length >= 3) { UI.toast('Feature up to 3 achievements'); Sound.play('ui_err'); return; }
          else profile.featuredAchievements.push(a.id);
          Save.write(); this.draw(body);
        };
        grid.appendChild(button);
      });
      if (!completed.length) grid.appendChild(el('div', 'profile-section-note', 'Complete Journal milestones to unlock awards for your profile.'));
      section.appendChild(grid); page.appendChild(section);
    }

    if (this.profilePage === 'save') {
      const intro = el('div', 'profile-page-intro');
      intro.innerHTML = '<b>Save connection</b><span>Cloud tools live here so they stay out of customization.</span>';
      page.appendChild(intro);
      const fullTestSave = Save.isTestSession();
      const cloudSave = Save.isAccountSave();
      const account = el('div', 'profile-account-card');
      if (fullTestSave) {
        account.appendChild(el('div', 'grow', 'Full Test Save is a local testing slot. It does not use your Websim account or cloud save.'));
      } else if (this.user) {
        const img = el('img'); img.src = this.user.avatar_url || ('https://images.websim.com/avatar/' + this.user.username); img.alt = '';
        const copy = el('div', 'grow'); copy.innerHTML = 'Posting as ';
        const link = el('a', '', '@' + this.user.username); link.href = 'https://websim.com/@' + encodeURIComponent(this.user.username); link.target = '_blank'; link.rel = 'noopener';
        copy.appendChild(link); copy.appendChild(el('div', 'profile-section-note', 'Your game profile stays in this save; Websim handles the account connection.'));
        account.appendChild(img); account.appendChild(copy);
      } else {
        account.appendChild(el('div', 'grow', Save.localSaveError
          ? 'Websim has not connected a signed-in account to this page yet. Local saving also needs attention.'
          : 'Websim has not connected a signed-in account to this page yet. Your progress remains stored locally.'));
        const retry = el('button', 'btn tiny', '↻ Retry');
        retry.type = 'button';
        retry.onclick = async () => {
          retry.disabled = true;
          retry.textContent = 'Connecting…';
          await this.start();
          if (body.isConnected) this.draw(body);
        };
        account.appendChild(retry);
      }
      page.appendChild(account);

      const cloud = el('div', 'cloud-card profile-cloud');
      cloud.appendChild(el('div', 'cloud-state', Save.localSaveError
        ? 'Local autosave failed. Check browser storage or download a backup in Settings.'
        : 'Local autosave is on for this device.'));
      let state = 'No cloud save yet.';
      if (fullTestSave) state = 'Full Test Save is isolated from cloud saves.';
      else if (!cloudSave) state = 'Cloud saving is available for Main Save only.';
      else if (!this.user) state = 'Connect to Websim to check your cloud save.';
      else if (this.cloudError) state = 'Cloud save is reconnecting.';
      else if (this.cloudConflict) state = 'Cloud changed elsewhere. This device kept its local save. Choose which copy to keep.';
      else if (this.invalidCloud) state = 'An old test save is being replaced with this Main Save.';
      else if (this.pendingSync) state = 'Saving local progress to Websim…';
      else if (this.cloud) {
        const when = this.cloud.updated_at_ms ? new Date(this.cloud.updated_at_ms).toLocaleString() : 'previous session';
        state = `Cloud save: Mastery ${fmt(this.cloud.mastery || 0)} · ${fmt(this.cloud.heroes || 0)} Heroes · ${when}`;
      }
      cloud.appendChild(el('div', 'cloud-state', state));
      const row = el('div', 'row');
      const uploadLabel = this.cloudError ? '↻ Retry Sync' : this.cloudConflict ? '↑ Replace Cloud' : '☁ Save Now';
      const upload = el('button', 'btn gold grow tiny', fullTestSave ? '☁ Disabled for Full Save' : (!cloudSave ? '☁ Main Save only' : (this.user ? uploadLabel : '☁ Sign in for Cloud Save')));
      upload.disabled = !this.user || !cloudSave;
      upload.onclick = async () => {
        upload.disabled = true;
        if (this.cloudError) {
          await this.refreshCloud();
          if (!this.cloudError) {
            this.reconcileCloud();
            if (this.pendingSync && !this.cloudConflict) await this.upload({ silent: true });
          }
          this.draw(body);
          return;
        }
        if (this.cloudConflict) {
          upload.disabled = false;
          UI.confirm('Replace cloud save?', 'The current cloud copy will be replaced by this device’s local save.', async () => {
            upload.disabled = true;
            if (await this.upload({ force: true })) this.draw(body);
            else if (upload.isConnected) upload.disabled = false;
          });
          return;
        }
        if (await this.upload()) this.draw(body);
        else if (upload.isConnected) upload.disabled = false;
      };
      const load = el('button', 'btn grow tiny', '↓ Load Cloud');
      load.disabled = !this.user || !this.cloud || this.invalidCloud || !!this.cloudError || !cloudSave;
      load.onclick = () => UI.confirm('Load cloud save?', 'This replaces the save currently stored on this device.', () => {
        if (this.cloud && this.cloud.save_json) {
          this.suppressAutosave = true;
          let ok = false;
          try { ok = Save.import(this.cloud.save_json, { skipCloud: true, touch: false }); }
          finally { this.suppressAutosave = false; }
          if (ok) { Save.data._updatedAt = Number(this.cloud.updated_at_ms) || Date.now(); Save.write({ skipCloud: true, touch: false }); this.setBaseAt(Number(this.cloud.updated_at_ms) || 0); location.reload(); }
          if (!ok) { Sound.play('ui_err'); UI.toast('Cloud save is invalid'); }
        } else { Sound.play('ui_err'); UI.toast('Cloud save is invalid'); }
      });
      row.appendChild(upload); row.appendChild(load); cloud.appendChild(row); page.appendChild(cloud);
    }

    body.appendChild(shell);
  }
};
