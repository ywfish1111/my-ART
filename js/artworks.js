/* 靜態美術頁：書背分類＋瀑布流＋詳細視窗 */
(function () {
  const P = window.Portfolio, esc = P.esc;

  P.loadData().then((d) => {
    const all = d.artworks;
    const cats = P.CATEGORIES.filter((c) => all.some((a) => a.category === c.key));
    // 資料表裡出現、但不在預設清單的分類也顯示
    [...new Set(all.map((a) => a.category))].forEach((k) => {
      if (!cats.some((c) => c.key === k)) cats.push({ key: k, latin: '', color: '#4a3a2a', h: 200 });
    });
    const notes = {
      '全部': '所有靜態作品，依分類排列。',
      '角色立繪': '《龍人商隊》登場角色的全身與半身立繪。',
      '人物設定': '角色三視圖、服裝與造型設定，以及世界觀中的生物設定。',
      '塔羅牌系列': (d.projects.find((p) => p.id === 'tarot') || {}).desc || '',
      '插畫': '場景插畫、遊戲封面與收集品插圖。',
      'Q版角色': (d.projects.find((p) => p.id === 'chibi') || {}).desc || '',
    };

    const shelf = document.getElementById('shelf');
    const grid = document.getElementById('grid');
    const note = document.getElementById('shelf-note');
    const spines = [{ key: '全部', latin: 'All', color: '#4a3524', h: 266 }, ...cats];
    shelf.innerHTML = spines.map((c) => {
      const n = c.key === '全部' ? all.length : all.filter((a) => a.category === c.key).length;
      return `<button class="spine" type="button" data-cat="${esc(c.key)}" aria-pressed="false" style="--c:${c.color};--h:${c.h}px" aria-label="${esc(c.key)}，${n} 件">
        <span class="t">${esc(c.key)}</span><span class="n">${n}</span></button>`;
    }).join('');

    let current = [];
    function show(cat) {
      if (!spines.some((s) => s.key === cat)) cat = '全部';
      shelf.querySelectorAll('.spine').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === cat));
      current = cat === '全部'
        ? cats.flatMap((c) => all.filter((a) => a.category === c.key))
        : all.filter((a) => a.category === cat);
      note.innerHTML = `<b>${esc(cat)}</b>${esc(notes[cat] || '')}`;
      grid.className = 'masonry' + (cat === '塔羅牌系列' ? ' tarot' : '');
      grid.innerHTML = current.map((w) => P.pieceHTML(w, { meta: cat === '全部' ? w.category : (w.subtitle || '') })).join('');
    }

    shelf.addEventListener('click', (e) => {
      const b = e.target.closest('.spine');
      if (!b) return;
      const cat = b.dataset.cat;
      history.replaceState(null, '', cat === '全部' ? location.pathname : '#' + encodeURIComponent(cat));
      show(cat);
    });
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.piece');
      if (b) P.openLightbox(current, b.dataset.id);
    });
    window.addEventListener('hashchange', () => show(decodeURIComponent(location.hash.slice(1)) || '全部'));
    show(decodeURIComponent(location.hash.slice(1)) || '全部');
  }).catch(P.fail);
})();
