# Nino Verse

Static, mobile-first travel search & planning site for **Nino Verse** by YSSN Nino.
Live: https://nino-travel.github.io/

* No build step: plain HTML/CSS/JS. Edit and push; GitHub Pages publishes automatically.
* **All affiliate IDs and Stripe Payment Links live in `config.js`.** Paste them there; nothing else needs to change.
  Search links work with blank IDs (they just aren't commission-tracked yet).
* Pages: home/search (`index.html`), Delay Help Center, Kids' Zone, guides, trip budget planner, policies.
* Paid downloads live under unlisted `/dl/<random>/` folders (no-index, disallowed in robots.txt). This is security by obscurity:
  anyone with the link can download. Rotate the folder name and update the Stripe redirect if a link leaks.
* `.github/workflows/decode-binaries.yml` turns uploaded `*.b64` files into binaries (PDF/PNG).
