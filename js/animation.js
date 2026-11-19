/* 動畫展示頁：Spine 4.3 即時播放 */
(function () {
  const P = window.Portfolio, esc = P.esc;
  const IC = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg>',
  };
  const SIDE = { '（左）': 'L', '（右）': 'R', '(左)': 'L', '(右)': 'R' };

  // 把「待機（左）」「待機（右）」合併成一個動作＋方向
  function groupMoves(anims) {
    const groups = [];
    anims.forEach((a) => {
      const m = a.label.match(/(（左）|（右）|\(左\)|\(右\))$/);
      const base = m ? a.label.slice(0, -m[0].length) : a.label;
      let g = groups.find((x) => x.base === base);
      if (!g) groups.push(g = { base, L: null, R: null, single: null });
      if (m) g[SIDE[m[0]]] = a.name; else g.single = a.name;
    });
    return groups;
  }

  P.loadData().then((d) => {
    const list = d.animations;
    const cast = document.getElementById('cast');
    const stage = document.getElementById('stage');
    const msg = document.getElementById('stage-msg');
    const controls = document.getElementById('controls');
    const info = document.getElementById('info');
    if (!list.length) { msg.textContent = '目前沒有動畫作品。'; return; }

    cast.innerHTML = list.map((a) => `
      <button type="button" data-id="${esc(a.id)}" aria-pressed="false">
        ${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : ''}
        <span>${esc(a.title)}</span>
      </button>`).join('');

    let player = null, holder = null, cur = null, groups = [], dir = 'L', move = null, paused = false, speed = 1;

    function variant(g) {
      return g.single || g[dir] || g.L || g.R;
    }
    function currentName() { return move ? variant(move) : null; }

    function play(name) {
      if (!player || !player.animationState || !name) return;
      player.setAnimation(name, true);
      if (paused) { player.play(); paused = false; syncControls(); }
    }

    function renderInfo(a) {
      const hasDir = groups.some((g) => g.L && g.R);
      const cover = d.artworks.find((w) => w.id === a.coverId);
      info.innerHTML = `
        <p class="crumb">${esc(a.project || '')}${a.project ? '／' : ''}Spine 動畫</p>
        <h2>${esc(a.title)}</h2>
        <div class="orn" aria-hidden="true"></div>
        ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
        <dl>
          ${a.role.length ? `<dt>負責項目</dt><dd>${a.role.map(esc).join('、')}</dd>` : ''}
          ${a.tools.length ? `<dt>使用工具</dt><dd>${a.tools.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</dd>` : ''}
          <dt>動作數量</dt><dd>${a.animations.length} 個</dd>
        </dl>
        <h3>動作</h3>
        <div class="moves" role="group" aria-label="切換動作">
          ${groups.map((g, i) => `<button type="button" data-i="${i}" aria-pressed="false">${esc(g.base)}</button>`).join('')}
        </div>
        ${cover ? `<button type="button" class="ref-link" data-ref="${esc(cover.id)}">查看原始角色圖</button>` : ''}`;
      controls.innerHTML = `
        <button class="ctrl" type="button" data-act="toggle" aria-label="暫停">${IC.pause}</button>
        <button class="ctrl" type="button" data-act="replay" aria-label="從頭播放">${IC.replay}</button>
        ${hasDir ? `<div class="dir" role="group" aria-label="角色方向">
          <button type="button" data-dir="L" aria-pressed="${dir === 'L'}">面向左</button>
          <button type="button" data-dir="R" aria-pressed="${dir === 'R'}">面向右</button></div>` : ''}
        <div class="speed" role="group" aria-label="播放速度">速度
          ${[0.5, 1, 1.5].map((s) => `<button type="button" data-speed="${s}" aria-pressed="${s === speed}">${s}×</button>`).join('')}
        </div>`;
    }

    function syncControls() {
      info.querySelectorAll('.moves button').forEach((b) => b.setAttribute('aria-pressed', groups[b.dataset.i] === move));
      controls.querySelectorAll('[data-dir]').forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.dir === dir);
        b.disabled = !!move && !(move[b.dataset.dir]);
      });
      const t = controls.querySelector('[data-act="toggle"]');
      if (t) { t.innerHTML = paused ? IC.play : IC.pause; t.setAttribute('aria-label', paused ? '播放' : '暫停'); }
    }

    function load(id) {
      const a = list.find((x) => x.id === id) || list[0];
      if (cur === a) return;
      cur = a;
      cast.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === a.id));
      groups = groupMoves(a.animations);
      move = groups.find((g) => [g.L, g.R, g.single].includes(a.defaultAnimation)) || groups[0];
      dir = move && move.R === a.defaultAnimation && !move.L ? 'R' : (move && move.L === a.defaultAnimation ? 'L' : dir);
      paused = false;
      renderInfo(a);
      syncControls();

      if (player) { try { player.dispose(); } catch (e) {} player = null; }
      holder?.remove();
      msg.hidden = false; msg.textContent = '動畫載入中…';
      holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;inset:0';
      stage.appendChild(holder);

      if (!window.spine || !window.spine.SpinePlayer) { msg.textContent = 'Spine 播放器載入失敗，請重新整理頁面。'; return; }
      player = new spine.SpinePlayer(holder, {
        skeleton: a.skeleton,
        atlas: a.atlas,
        animation: currentName(),
        animations: a.animations.map((x) => x.name),
        showControls: false,
        showLoading: false,
        alpha: true,
        backgroundColor: '#00000000',
        preserveDrawingBuffer: false,
        viewport: { padLeft: '10%', padRight: '10%', padTop: '8%', padBottom: '14%', transitionTime: 0.25 },
        success: (p) => {
          msg.hidden = true; p.speed = speed;
          // 在 Spine 裡用眼睛圖示隱藏的插槽，執行時仍會顯示；這裡比照編輯器把它們藏起來
          let hid = false;
          p.skeleton.data.slots.forEach((sd) => { if (sd.visible === false) { sd.attachmentName = null; hid = true; } });
          if (hid) p.skeleton.setupPoseSlots?.();
        },
        error: (p, m) => { msg.hidden = false; msg.textContent = '動畫載入失敗：' + m; console.error(m); },
      });
      if (location.hash.slice(1) !== a.id) history.replaceState(null, '', '#' + a.id);
    }

    cast.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (b) load(b.dataset.id);
    });
    info.addEventListener('click', (e) => {
      const b = e.target.closest('.moves button');
      if (b) { move = groups[b.dataset.i]; play(currentName()); syncControls(); return; }
      const r = e.target.closest('[data-ref]');
      if (r) P.openLightbox(d.artworks.filter((w) => w.id === r.dataset.ref), r.dataset.ref);
    });
    controls.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !player) return;
      if (b.dataset.act === 'toggle') { paused ? player.play() : player.pause(); paused = !paused; }
      if (b.dataset.act === 'replay') play(currentName());
      if (b.dataset.dir) { dir = b.dataset.dir; play(currentName()); }
      if (b.dataset.speed) {
        speed = Number(b.dataset.speed); player.speed = speed;
        controls.querySelectorAll('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', Number(x.dataset.speed) === speed));
      }
      syncControls();
    });
    // 不在畫面上時停止繪製，節省電力
    document.addEventListener('visibilitychange', () => {
      if (!player) return;
      if (document.hidden) player.stopRendering?.(); else player.startRendering?.();
    });
    window.addEventListener('hashchange', () => load(location.hash.slice(1)));
    load(location.hash.slice(1));
  }).catch(P.fail);
})();
