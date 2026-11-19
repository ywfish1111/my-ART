/* 首頁 */
(function () {
  const P = window.Portfolio, esc = P.esc;

  P.loadData().then((d) => {
    const { site, artworks, animations, projects } = d;
    const latin = (site.nameEn || '').split('/').pop().trim() || 'YellowFish';
    const alias = (site.nameEn || '').split('/')[0].trim();

    /* 主視覺 */
    const heroWork = artworks.find((a) => a.id === site.hero) || artworks[0];
    document.getElementById('hero').innerHTML = `
      <div class="wrap">
        <div class="hero-plate gilt-frame">
          <img src="${esc(heroWork.large)}" alt="${esc(heroWork.title)}" fetchpriority="high">
          <div class="hero-title">
            <p class="latin">${esc(latin)}</p>
            <h1>${esc(site.name)}</h1>
            <p>${esc(site.tagline)}</p>
            <div class="btns">
              <a class="btn solid" href="artworks.html">瀏覽靜態美術</a>
              <a class="btn" href="animation.html">觀看 Spine 動畫</a>
            </div>
          </div>
        </div>
        <p class="hero-caption">${esc(heroWork.title)}${heroWork.desc ? '　' + esc(heroWork.desc) : ''}</p>
      </div>`;

    /* 關於我 */
    document.getElementById('about').innerHTML = `
      <div class="wrap">
        <div class="section-head"><h2>關於我</h2><span class="latin">About</span><span class="rule"></span></div>
        <div class="about">
          ${site.avatar ? `<img class="portrait" src="${esc(site.avatar)}" alt="${esc(site.name)}的自畫像" width="640" height="640">` : '<span></span>'}
          <div>
            <h3>${esc(site.name)}</h3>
            ${alias ? `<p class="alias">${esc(alias)}　${esc(latin)}</p>` : ''}
            <p>${esc(site.about)}</p>
            <dl>
              <dt>主要工作</dt><dd>${esc((site.tagline || '').split('｜')[0])}</dd>
              <dt>擅長軟體</dt><dd>${site.tools.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">Spine</span></dd>
              ${site.email ? `<dt>聯絡</dt><dd><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></dd>` : ''}
            </dl>
          </div>
        </div>
      </div>`;

    /* 精選作品：靜態＋動畫 */
    const featured = artworks.filter((a) => a.featured);
    const featAnim = animations.filter((a) => a.featured);
    const cards = [
      ...featured.map((w) => P.pieceHTML(w)),
      ...featAnim.map((a) => {
        const cover = artworks.find((w) => w.id === a.coverId);
        const fake = { ...(cover || {}), id: 'anim:' + a.id, title: a.title, subtitle: '', category: 'Q版角色', thumb: a.cover };
        return P.pieceHTML(fake, { play: true, meta: 'Spine 動畫' });
      }),
    ];
    const featEl = document.getElementById('featured');
    featEl.innerHTML = `
      <div class="wrap">
        <div class="section-head"><h2>精選作品</h2><span class="latin">Selected</span><span class="rule"></span><a class="more" href="artworks.html">看全部作品</a></div>
        <div class="masonry cols-3">${cards.join('')}</div>
      </div>`;
    featEl.addEventListener('click', (e) => {
      const b = e.target.closest('.piece');
      if (!b) return;
      const id = b.dataset.id;
      if (id.startsWith('anim:')) location.href = 'animation.html#' + id.slice(5);
      else P.openLightbox(featured, id);
    });

    /* 專題 */
    const homeProjects = projects.filter((p) => p.home);
    const fanFor = (p) => {
      const pool = p.id === 'tarot' ? artworks.filter((a) => a.category === '塔羅牌系列')
        : p.id === 'chibi' ? artworks.filter((a) => a.category === 'Q版角色')
        : artworks.filter((a) => a.category === '角色立繪' && a.project === '龍人商隊');
      const pick = pool.filter((a) => a.featured).concat(pool).slice(0, 3);
      return pick.map((a) => `<img src="${esc(a.thumb)}" alt="" loading="lazy">`).join('');
    };
    const linkFor = (p) => p.id === 'tarot' ? 'artworks.html#塔羅牌系列' : p.id === 'chibi' ? 'artworks.html#Q版角色' : 'artworks.html#角色立繪';
    if (homeProjects.length) {
      document.getElementById('projects').innerHTML = `
        <div class="wrap">
          <div class="section-head"><h2>創作專題</h2><span class="latin">Projects</span><span class="rule"></span></div>
          <div class="projects">
            ${homeProjects.map((p) => `
              <article class="project">
                <a class="fan" href="${linkFor(p)}" aria-label="看${esc(p.name)}的作品">${fanFor(p)}</a>
                <div>
                  <h3>${esc(p.name)}</h3>
                  <p>${esc(p.desc)}</p>
                  ${p.role ? `<span class="role">${esc(p.role)}</span>` : ''}
                </div>
              </article>`).join('')}
          </div>
        </div>`;
    }

    /* 兩本書入口 */
    const staticCover = artworks.find((a) => a.id === 'illus-06') || artworks.find((a) => a.category === '插畫');
    const animCover = artworks.find((a) => a.id === (animations[0] && animations[0].coverId));
    document.getElementById('volumes').innerHTML = `
      <div class="wrap">
        <div class="section-head"><h2>繼續翻閱</h2><span class="latin">Volumes</span><span class="rule"></span></div>
        <div class="volumes">
          <a class="volume" href="artworks.html" style="--c:#5a2e24">
            <span class="vspine"><span>靜態美術</span></span>
            <span class="vcover">
              ${staticCover ? `<img src="${esc(staticCover.thumb)}" alt="" loading="lazy">` : ''}
              <span class="vtext"><b>靜態美術</b><span>角色立繪、人物設定、塔羅牌、插畫與 Q 版角色，共 ${artworks.length} 件</span></span>
            </span>
          </a>
          <a class="volume" href="animation.html" style="--c:#2f4656">
            <span class="vspine"><span>動畫展示</span></span>
            <span class="vcover" style="background:radial-gradient(ellipse at 60% 60%, #34493c, #131c17 75%)">
              <span style="position:absolute;inset:0;display:flex;justify-content:flex-end;align-items:flex-end;gap:8px;padding:20px 20px 70px;opacity:.85">
                ${animations.slice(0, 3).map((a) => a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy" style="position:static;width:auto;height:150px;object-fit:contain;opacity:1">` : '').join('')}
              </span>
              <span class="vtext"><b>動畫展示</b><span>${animations.length} 個 Spine 角色，可以切換動作即時播放</span></span>
            </span>
          </a>
        </div>
      </div>`;
  }).catch(P.fail);
})();
