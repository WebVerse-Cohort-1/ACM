---
description: How to fix asset loading issues on GitHub Pages
---
# Workflow: Fix Asset Loading

This workflow provides steps to diagnose and solve issues where images or other assets fail to load specifically on GitHub Pages.

1. **Check Base URL**
   - Ensure `index.html` does not have a hardcoded `<base href="/">` if it's deployed in a subdirectory (repo-name).
   - Verify that script paths are correctly relative (e.g., `./src/App.jsx`).

2. **CORS & Referrer Policy**
   - Check if external providers (like Google Drive) are blocking requests from `<username>.github.io`.
   - In `index.html`, try adding `<meta name="referrer" content="no-referrer">` if the images are being blocked due to the referer header.

3. **HTTPS Enforcement**
   - Ensure all `img src` URLs start with `https://`. GitHub Pages is served over HTTPS and will block "Mixed Content" (HTTP).

4. **Verify Endpoint**
   - If using `https://drive.google.com/thumbnail?id=...`, test if the `sz` parameter or specific ID format is the cause of the failure.
