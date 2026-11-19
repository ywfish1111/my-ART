#!/usr/bin/env python3
"""
作品集網站資料建置腳本
讀取 作品資料表.xlsx + artworks/ + spine_4.3/ ，產生：
  portfolio-site/data/works.json
  portfolio-site/img/thumb/*.webp, img/large/*.webp, img/profile/*
  portfolio-site/spine/<id>/skeleton.{json,atlas,png}
原始檔案不會被修改。已經產生過、且原圖沒有更新的圖片會略過。

用法：python3 build.py [素材資料夾] [--only-data]
"""
import json, os, re, shutil, sys
from openpyxl import load_workbook
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
BASE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else os.path.join(os.path.dirname(__file__), '..', '..'))
ONLY_DATA = '--only-data' in sys.argv
OUT = os.path.join(BASE, 'portfolio-site')
XLSX = os.environ.get('WORKS_XLSX') or os.path.join(BASE, '作品資料表.xlsx')

THUMB_BOX = (720, 960)
LARGE_MAX = 2400


def s(v):
    return '' if v is None else str(v).strip()


def yes(v):
    return s(v).upper() in ('Y', 'YES', 'V', '1', 'TRUE')


def split_list(v):
    return [x.strip() for x in re.split(r'[、，,／/]', s(v)) if x.strip()]


def rows(ws):
    it = ws.iter_rows(values_only=True)
    head = [s(h) for h in next(it)]
    for r in it:
        if not any(c not in (None, '') for c in r):
            continue
        yield {head[i]: r[i] for i in range(len(head))}


def needs(src, dst):
    return not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)


def save_webp(im, dst, quality):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=5)


def process_image(src, wid, log):
    thumb = os.path.join(OUT, 'img', 'thumb', wid + '.webp')
    large = os.path.join(OUT, 'img', 'large', wid + '.webp')
    with Image.open(src) as im0:
        w, h = im0.size
        if ONLY_DATA or (not needs(src, thumb) and not needs(src, large)):
            return w, h
        im = im0.convert('RGBA') if im0.mode in ('RGBA', 'LA', 'P') else im0.convert('RGB')
        t = im.copy(); t.thumbnail(THUMB_BOX, Image.LANCZOS)
        save_webp(t, thumb, 80)
        l = im.copy()
        if max(w, h) > LARGE_MAX:
            l.thumbnail((LARGE_MAX, LARGE_MAX), Image.LANCZOS)
        save_webp(l, large, 86)
        log.append(wid)
        return w, h


def main():
    wb = load_workbook(XLSX, data_only=True)
    log = []

    # ---- 個人資料
    prof = {s(r['項目']): s(r['內容']) for r in rows(wb['個人資料'])}
    def pf(prefix):
        for k, v in prof.items():
            if k.startswith(prefix):
                return v
        return ''
    site = {
        'name': pf('顯示名稱'), 'nameEn': pf('英文名稱'), 'tagline': pf('一句話介紹'),
        'about': pf('關於我'), 'tools': split_list(pf('使用工具')), 'email': pf('Email'),
        'instagram': pf('Instagram'), 'facebook': pf('Facebook'), 'other': pf('其他連結'),
        'resume': pf('履歷'), 'hero': pf('首頁首屏'),
    }
    avatar_src = os.path.join(BASE, '個人資訊', '頭像.PNG')
    if os.path.exists(avatar_src):
        dst = os.path.join(OUT, 'img', 'profile', 'avatar.webp')
        if needs(avatar_src, dst) and not ONLY_DATA:
            with Image.open(avatar_src) as im:
                im = im.convert('RGBA'); im.thumbnail((640, 640), Image.LANCZOS); save_webp(im, dst, 86)
        site['avatar'] = 'img/profile/avatar.webp'
    if site['resume']:
        src = os.path.join(BASE, '個人資訊', site['resume'])
        if os.path.exists(src):
            os.makedirs(os.path.join(OUT, 'files'), exist_ok=True)
            shutil.copy2(src, os.path.join(OUT, 'files', 'resume.pdf'))
            site['resume'] = 'files/resume.pdf'
        else:
            site['resume'] = ''

    # ---- 專題
    projects = []
    for r in rows(wb['專題']):
        projects.append({'id': s(r['專題代號']), 'name': s(r['專題名稱']), 'desc': s(r.get('簡介（1～3 句）')),
                         'role': s(r.get('你在專題中的角色')), 'home': yes(r.get('顯示在首頁'))})

    # ---- 靜態作品
    artworks = []
    for i, r in enumerate(rows(wb['靜態作品'])):
        wid = s(r['編號'])
        if not wid or yes(r.get('隱藏(Y)')):
            continue
        src = os.path.join(BASE, s(r['原始檔案']))
        if not os.path.exists(src):
            print('!! 找不到圖片：', wid, src); continue
        w, h = process_image(src, wid, log)
        title = s(r['作品名稱'])
        sub = ''
        if '｜' in title:
            title, sub = [x.strip() for x in title.split('｜', 1)]
        order = s(r.get('排序'))
        artworks.append({
            'id': wid, 'category': s(r['分類']), 'title': title, 'subtitle': sub,
            'project': s(r.get('所屬專題')), 'desc': s(r.get('作品介紹')),
            'tools': split_list(r.get('使用工具')), 'role': split_list(r.get('負責項目')),
            'featured': yes(r.get('精選(Y)')), 'order': float(order) if order else 1000 + i,
            'w': w, 'h': h,
            'thumb': f'img/thumb/{wid}.webp', 'large': f'img/large/{wid}.webp',
        })
    artworks.sort(key=lambda a: a['order'])

    # ---- Spine
    anim_rows = {}
    for r in rows(wb['Spine動作']):
        anim_rows.setdefault(s(r['角色編號']), []).append(r)
    animations = []
    for i, r in enumerate(rows(wb['Spine角色'])):
        sid = s(r['編號'])
        if not sid or yes(r.get('隱藏(Y)')):
            continue
        jpath = os.path.join(BASE, s(r['原始檔案']))
        folder = os.path.dirname(jpath)
        stem = os.path.splitext(os.path.basename(jpath))[0]
        atlas = next((os.path.join(folder, f) for f in os.listdir(folder) if '.atlas' in f), None)
        pngs = [f for f in os.listdir(folder) if f.lower().endswith('.png')]
        od = os.path.join(OUT, 'spine', sid)
        os.makedirs(od, exist_ok=True)
        shutil.copy2(jpath, os.path.join(od, 'skeleton.json'))
        # 重新命名貼圖並修正 atlas 內的頁面名稱
        lines = open(atlas, encoding='utf-8').read().splitlines()
        page_map = {}
        for n, p in enumerate(sorted(pngs)):
            new = 'skeleton.png' if len(pngs) == 1 else f'skeleton_{n + 1}.png'
            page_map[p] = new
            shutil.copy2(os.path.join(folder, p), os.path.join(od, new))
        lines = [page_map.get(l.strip(), l) for l in lines]
        open(os.path.join(od, 'skeleton.atlas'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

        anims, default = [], ''
        for a in anim_rows.get(sid, []):
            if yes(a.get('隱藏(Y)')):
                continue
            if a['動作原名'] is None:
                continue
            name = str(a['動作原名'])  # 保留原始空白（例如 "fight_ hit_R"），要和 Spine 檔完全一致
            anims.append({'name': name, 'label': s(a.get('網站顯示名稱')) or name})
            if yes(a.get('預設播放(Y)')):
                default = name
        if not default and anims:
            default = anims[0]['name']
        cover_id = s(r.get('對照的靜態作品編號'))
        cover = next((a for a in artworks if a['id'] == cover_id), None)
        order = s(r.get('排序'))
        animations.append({
            'id': sid, 'title': s(r['角色名稱']), 'project': s(r.get('所屬專題')),
            'desc': s(r.get('作品介紹')), 'tools': split_list(r.get('使用工具')),
            'role': split_list(r.get('負責項目')), 'featured': yes(r.get('精選(Y)')),
            'order': float(order) if order else 1000 + i, 'background': s(r.get('背景')) or '純色深底',
            'cover': cover['thumb'] if cover else '', 'coverId': cover_id,
            'skeleton': f'spine/{sid}/skeleton.json', 'atlas': f'spine/{sid}/skeleton.atlas',
            'animations': anims, 'defaultAnimation': default,
        })
    animations.sort(key=lambda a: a['order'])

    hero = next((a for a in artworks if a['id'] == site['hero']), None)
    if hero:
        site['heroImage'] = hero['large']; site['heroThumb'] = hero['thumb']

    data = {'site': site, 'projects': projects, 'artworks': artworks, 'animations': animations}
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
    with open(os.path.join(OUT, 'data', 'works.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f'完成：靜態 {len(artworks)} 件、動畫 {len(animations)} 件；本次處理圖片 {len(log)} 張')


if __name__ == '__main__':
    main()
