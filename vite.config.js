import { defineConfig } from 'vite';

// ВАЖЛИВО для GitHub Pages (проєктна сторінка виду
// https://<username>.github.io/<repo-name>/):
// замініть рядок нижче на '/<repo-name>/' (зі слешами з обох боків).
// Якщо сайт буде на власному домені або на <username>.github.io (user page),
// залиште '/'.
const GH_PAGES_BASE = '/moving/';

export default defineConfig({
  base: GH_PAGES_BASE,
  build: {
    outDir: 'dist',
  },
});
