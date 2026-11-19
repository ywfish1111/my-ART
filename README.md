# 黃子芸 YellowFish 作品集網站

三個頁面：`index.html`（首頁）、`artworks.html`（靜態美術）、`animation.html`（Spine 動畫）。
所有作品資料都在 `data/works.json`，由上一層資料夾的 `作品資料表.xlsx` 產生。

## 新增或修改作品

1. 把圖片放進 `web_class_work/artworks/<分類資料夾>/`，Spine 檔放進 `spine_4.3/<角色>/`。
2. 在 `作品資料表.xlsx` 加一列（編號不要重複，例如 `char-23`），填好名稱、分類、介紹。
3. 執行 `tools/build.py`（或請 Claude 幫你執行），會更新 `data/works.json`，並產生壓縮過的網頁圖片：
   ```
   python tools/build.py
   ```
   需要 Python 3、`openpyxl`、`Pillow`（`pip install openpyxl pillow`）。已處理過的圖片會略過。
4. 把整個 `portfolio-site` 資料夾的變更上傳到 GitHub。

## 本機預覽

直接雙擊 HTML 檔無法讀取作品資料，要用網頁伺服器開啟：
```
cd portfolio-site
python -m http.server 8000
```
然後用瀏覽器開 http://localhost:8000

## 上傳到 GitHub Pages

1. 到 GitHub 建立新的 repository。想要網址是 `https://帳號.github.io/` 的話，repository 名稱就取 `帳號.github.io`；取其他名稱，網址會是 `https://帳號.github.io/名稱/`。
2. 在 repository 頁面按「Add file → Upload files」，把 `portfolio-site` 資料夾**裡面的所有檔案和資料夾**拖進去（不是拖 `portfolio-site` 這個資料夾本身），按「Commit changes」。
   - 檔案很多時，用 GitHub Desktop 會比較方便：Clone 這個 repository → 把檔案複製進去 → Commit → Push。
3. 到 Settings → Pages，Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
4. 等一兩分鐘，頁面上方會出現網站網址。

## 技術說明

- Spine 播放器：`vendor/spine-player.min.js`（@esotericsoftware/spine-player 4.3.13），要搭配 Spine 4.3 匯出的檔案。之後如果升級 Spine 編輯器到新的主版本，播放器也要換成對應版本。
- 在 Spine 編輯器用眼睛圖示隱藏的插槽，執行時仍然會顯示。網站已經比照編輯器把它們藏起來，但遊戲裡的播放器不會這樣處理（例如莉賽爾的 `fx_glow-2`）。
- 字型來自 Google Fonts：Noto Serif TC、LXGW WenKai TC、IM Fell English、UnifrakturMaguntia。
- Spine Runtimes 授權見 `vendor/SPINE-LICENSE.txt`。
