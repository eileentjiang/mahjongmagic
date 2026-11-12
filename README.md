# Mahjong Magic

Mahjong scoring and payouts for a friendly game night: enter the winning hand, see every scoring pattern and who pays what, and settle up at the end.

- Product: [`docs/PRD.md`](docs/PRD.md) · Tech spec: [`docs/SPEC.md`](docs/SPEC.md) · Design: [`DESIGN.md`](DESIGN.md)
- Rules: Hong Kong style (MCR) with the owner's House default rules ([`docs/variants`](docs/variants))

## Run it
```
npm install
npm run dev      # local dev server
npm test         # scoring engine tests
npm run build    # production build in dist/
```
Pushing to `main` deploys to GitHub Pages.
