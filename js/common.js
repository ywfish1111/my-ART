/* 共用：讀取資料、導覽列、頁尾、作品詳細視窗 */
(function () {
  const ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v7h4v-7h3l.6-4H14V8.6c0-.4.2-.6.6-.6Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>',
  };

  const CATEGORIES = [
    { key: '角色立繪', latin: 'Portraits', color: '#5a2e24', h: 236 },
    { key: '人物設定', latin: 'Model Sheets', color: '#2f4656', h: 214 },
    { key: '塔羅牌系列', latin: 'Arcana', color: '#3c2c4c', h: 250 },
    { key: '插畫', latin: 'Illustration', color: '#3a4a2b', h: 200 },
    { key: 'Q版角色', latin: 'Chibi', color: '#6a5526', h: 184 },
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let dataPromise;
  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch('data/works.json', { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    }
    return dataPromise;
  }

  /* ---------- 導覽列 ---------- */
  function initNav(site) {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const toggle = nav.querySelector('.nav-toggle');
    toggle?.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    const social = nav.querySelector('.nav-social');
    if (social && site) social.innerHTML = socialLinks(site, 'icon-btn');
  }

  function socialLinks(site, cls) {
    const out = [];
    if (site.email) out.push(`<a class="${cls}" href="mailto:${esc(site.email)}" aria-label="寄信給${esc(site.name)}" title="Email">${ICONS.mail}</a>`);
    if (site.instagram) out.push(`<a class="${cls}" href="${esc(site.instagram)}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">${ICONS.ig}</a>`);
    if (site.facebook) out.push(`<a class="${cls}" href="${esc(site.facebook)}" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">${ICONS.fb}</a>`);
    if (site.other) out.push(`<a class="${cls}" href="${esc(site.other)}" target="_blank" rel="noopener" aria-label="其他連結" title="其他連結">${ICONS.link}</a>`);
    return out.join('');
  }

  /* ---------- 頁尾 ---------- */
  function renderFooter(site) {
    const el = document.querySelector('.footer');
    if (!el) return;
    const year = new Date().getFullYear();
    const latin = (site.nameEn || '').split('/').pop().trim() || 'YellowFish';
    el.innerHTML = `
      <div class="wrap">
        <div>
          <h2>一起合作</h2>
          <p>歡迎來信洽談遊戲美術、角色設計與 Spine 動畫的工作機會。</p>
          ${site.email ? `<a class="mail" href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ''}
        </div>
        <div class="links">
          ${socialLinks(site, 'btn')}
          ${site.resume ? `<a class="btn" href="${esc(site.resume)}" target="_blank" rel="noopener">下載履歷</a>` : ''}
        </div>
        <div class="small">
          <span><span class="brand-mark">${esc(latin)}</span>　© ${year} ${esc(site.name)}</span>
          <span>作品版權皆屬作者所有，未經同意請勿轉載。</span>
        </div>
      </div>`;
    // 頁尾按鈕用文字而不是圖示
    el.querySelectorAll('.links a.btn[aria-label]').forEach((a) => {
      const name = a.getAttribute('title');
      a.innerHTML = a.innerHTML + `<span>${name}</span>`;
      a.querySelector('svg')?.setAttribute('width', '16');
    });
  }

  /* ---------- 作品卡 ---------- */
  function pieceHTML(w, opts = {}) {
    const ratio = w.w && w.h ? (w.h / w.w) : 1;
    const tw = 720, th = Math.round(tw * ratio);
    const transparent = w.category === 'Q版角色' || w.category === '角色立繪' && !w.id.startsWith('bust');
    const label = w.subtitle ? `${w.title}｜${w.subtitle}` : w.title;
    return `
      <button class="piece${transparent ? ' transparent' : ''}" type="button" data-id="${esc(w.id)}" aria-label="查看作品：${esc(label)}">
        <div class="frame">
          <img src="${esc(w.thumb)}" width="${tw}" height="${th}" alt="${esc(label)}" loading="lazy" decoding="async">
          ${opts.play ? `<span class="play-mark" aria-hidden="true">${ICONS.play}</span>` : ''}
        </div>
        <div class="cap"><b>${esc(w.title)}</b><span>${esc(opts.meta ?? (w.subtitle || w.category))}</span></div>
      </button>`;
  }

  /* ---------- 詳細視窗 ---------- */
  let lb, lbList = [], lbIndex = 0, lastFocus = null;
  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '作品詳細資訊');
    lb.innerHTML = `
      <div class="book">
        <div class="plate"><img alt=""><div class="lb-hint">點圖片可放大檢視細節　←　→ 切換作品　Esc 關閉</div></div>
        <div class="page">
          <p class="crumb"></p>
          <h2></h2>
          <p class="sub"></p>
          <div class="orn" aria-hidden="true"></div>
          <p class="desc"></p>
          <dl></dl>
          <div class="pager">
            <button type="button" data-step="-1">上一件</button>
            <span class="count"></span>
            <button type="button" data-step="1">下一件</button>
          </div>
        </div>
      </div>
      <button class="lb-close" type="button" aria-label="關閉">×</button>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.closest('.lb-close')) return closeLightbox();
      const step = e.target.closest('[data-step]');
      if (step) return showAt(lbIndex + Number(step.dataset.step));
      const plate = e.target.closest('.plate');
      if (plate && e.target.tagName === 'IMG') plate.classList.toggle('zoomed');
    });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showAt(lbIndex + 1);
      if (e.key === 'ArrowLeft') showAt(lbIndex - 1);
      if (e.key === 'Tab') { // 焦點留在視窗內
        const f = [...lb.querySelectorAll('button')];
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    return lb;
  }
  function showAt(i) {
    if (!lbList.length) return;
    lbIndex = (i + lbList.length) % lbList.length;
    const w = lbList[lbIndex];
    const plate = lb.querySelector('.plate');
    plate.classList.remove('zoomed');
    const img = plate.querySelector('img');
    img.src = w.thumb; // 先顯示縮圖，大圖載入後替換
    img.alt = w.title;
    const big = new Image();
    big.onload = () => { if (lbList[lbIndex] === w) img.src = w.large; };
    big.src = w.large;
    lb.querySelector('.crumb').textContent = [w.project, w.category].filter(Boolean).join('／');
    lb.querySelector('h2').textContent = w.title;
    const sub = lb.querySelector('.sub');
    sub.textContent = w.subtitle || '';
    sub.hidden = !w.subtitle;
    lb.querySelector('.desc').textContent = w.desc || '';
    const rows = [];
    if (w.role?.length) rows.push(`<dt>負責項目</dt><dd>${w.role.map(esc).join('、')}</dd>`);
    if (w.tools?.length) rows.push(`<dt>使用工具</dt><dd>${w.tools.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</dd>`);
    rows.push(`<dt>原圖尺寸</dt><dd>${w.w} × ${w.h} px</dd>`);
    lb.querySelector('dl').innerHTML = rows.join('');
    lb.querySelector('.count').textContent = `${lbIndex + 1} / ${lbList.length}`;
    // 預先載入下一張
    const n = lbList[(lbIndex + 1) % lbList.length];
    if (n) new Image().src = n.large;
  }
  function openLightbox(list, id) {
    ensureLightbox();
    lbList = list;
    lastFocus = document.activeElement;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showAt(Math.max(0, list.findIndex((w) => w.id === id)));
    lb.querySelector('.lb-close').focus();
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lastFocus?.focus();
  }

  function fail(err) {
    console.error(err);
    const main = document.querySelector('main');
    const msg = location.protocol === 'file:'
      ? '請透過網頁伺服器開啟這個網站（例如上傳到 GitHub Pages，或在資料夾中執行 python -m http.server），直接雙擊 HTML 檔案無法讀取作品資料。'
      : '作品資料讀取失敗，請重新整理頁面。';
    main.insertAdjacentHTML('afterbegin', `<p class="load-error">${msg}</p>`);
  }

  window.Portfolio = { loadData, initNav, renderFooter, pieceHTML, openLightbox, esc, ICONS, CATEGORIES, socialLinks, fail };

  // 每頁共用的初始化
  loadData().then((d) => { initNav(d.site); renderFooter(d.site); }).catch(() => initNav(null));
})();
