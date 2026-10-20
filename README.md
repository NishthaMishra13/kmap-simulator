# K-Map Studio

A responsive, no-build-step Karnaugh map simulator made with HTML, CSS and vanilla JavaScript.

## Live Demo
https://nishthamishra13.github.io/kmap-simulator/?utm_source=chatgpt.com

## Features
- 2-, 3-, and 4-variable maps (4, 8, or 16 cells)
- Minterm/SOP and maxterm/POS modes
- Interactive cells in Gray-code order
- Simplified Boolean expression
- Live truth table and CSV export
- Copy expression/index list, random fill, reset
- Responsive layout for mobile and desktop

## Run locally
Open `index.html` in a browser. For a local server, open the folder in VS Code and use the Live Server extension.

## Deploy with GitHub Pages
1. Create a GitHub repository named `kmap-studio`.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then click **Save**.
6. Wait a minute or two. GitHub will show the public website URL in the Pages section.

## Deploy with Netlify
1. Go to https://app.netlify.com/ and sign in.
2. Choose **Add new site → Deploy manually** (wording may vary).
3. Drag the `kmap-studio` folder into the deploy area.
4. Netlify will publish it and provide a URL. You can change the site name in site settings.

## Notes
- This is a static website; no backend, database, API key, or build step is required.
- The minimizer uses a Quine–McCluskey-style implicant generation plus a greedy cover selection. It is suitable for the included 2–4 variable learning simulator; for formally guaranteed global minimums on every larger/generalized function, use an exact prime-implicant cover solver.
