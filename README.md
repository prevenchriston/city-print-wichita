# City Print — Wichita, KS

Static website (HTML + CSS + vanilla JS). No build step, no dependencies except the two Google Fonts.

## Preview locally

```bash
cd city-print-wichita && python3 -m http.server 4173
# open http://127.0.0.1:4173
```

## Deploy

Upload the whole folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or the
existing hosting). `index.html` is the entry point.

## Things the owner needs to set

Everything editable lives in `assets/js/site-config.js`.

1. **Reviews.** Paste real reviews (e.g. from the Google Business Profile) into `reviews: []`.
   The section and its nav link stay hidden until at least one review exists. No reviews are invented.
2. **Quote form delivery.** With `formEndpoint: ""` the form opens the visitor's email app addressed to
   `sales@cityprintusa.com`. For inbox delivery, create a free form at formspree.io and paste its URL.
3. **Photos.** All images came from cityprintusa.com and are in `assets/img/` (originals in `assets/img/src/`).
   Confirm the rights, and swap in the shop's own press/team photos when available.

## Content notes to confirm

- Site copy says both "in the printing business since 1940" and "more than 30 years". The site uses "30+ years".
- Contact details come from the current site: (316) 267-5555, toll free 1-866-907-1222, fax (316) 262-4409,
  235 S Ellis St, Wichita KS 67211, Mon–Fri 8am–5pm Central, sales@cityprintusa.com.

## Motion & performance

- Animations use `transform` and `opacity` only, and are disabled for `prefers-reduced-motion`.
- Images are WebP with responsive `srcset`, explicit width/height (no layout shift), and lazy loading below the fold.
- HTML + CSS + JS total about 80 KB uncompressed.
