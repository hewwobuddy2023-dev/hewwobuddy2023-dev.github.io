# ALA 4DX — ROOT GitHub Pages hosting package

This folder contains the *publishable static site* extracted from the latest 23-file hosting ZIP plus `.nojekyll`. It does NOT contain the teacher's Google Sheet. It is not automatically deployed.

## Important path constraint
The application uses root-relative URLs such as `/app.js`, `/styles.css`, `/event/`. Deploy it to a GitHub Pages USER ROOT repository named exactly `<YOUR_GITHUB_USERNAME>.github.io`, so its site root is `https://<YOUR_GITHUB_USERNAME>.github.io/`. Do not upload unchanged to an ordinary project repo at `/ala-scoreboard/`; assets/routes will point outside that project folder.

## Manual publish
1. Open GitHub signed in to the account you will use.
2. Create a PUBLIC repository named `<your-real-username>.github.io` (replace placeholder; repository owner username must match). Never put secrets or identifiable student data into a public repo.
3. Upload the CONTENTS of this folder to the repo root, not the enclosing folder. Important: `index.html` must be at the repo root. Include `.nojekyll` if possible.
4. GitHub repo > Settings > Pages > Build and deployment > Source: Deploy from a branch > `main` > `/ (root)` > Save.
5. Observe actual GitHub Pages deployment status and open `https://<your-real-username>.github.io/`. Test `/event/` and `/display/momentum/`. Do not presume the site is live until it opens.
6. On SCHOOL WI-FI, test the exact published URL and its assets from a school Chromebook. Then test on iPhone (Wi-Fi, not cellular) and on an ordinary computer.

## What works/doesn't
- All static pages, event simulation and local browser UI can be served to any compatible browser.
- Teacher's live Google Apps Script may still demand school sign-in; hosting cannot fix it. Keep `/event/` clearly SIMULATED and self-contained.
- A browser on one phone may not share replay state with an entirely different device (browser-local state).
- File use in the public repo must be reviewed for privacy and account permissions.
- GitHub sign-in might still require the account's existing authentication; this plan removes Firebase's login, not the security requirements of GitHub.

## Other hosts
Render Static Site is the next candidate if GitHub Pages blocked; GitLab Pages and Neocities also serve HTML/CSS/JS. Their school-network accessibility is UNKNOWN until tested.
