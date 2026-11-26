# Thanh Phung - 3D Portfolio

The 3D shell for Thanh Phung's portfolio. It embeds the companion `portfolio-inner-site` application on the computer screen.

## Local development

From this directory:

```bash
npm install
npm run dev
```

The 3D site runs at `http://localhost:8080`; run the companion inner site at `http://localhost:3000` at the same time. The shared portfolio data is read from `../portfolio-inner-site/src/portfolio.config.json` when present. For a standalone local checkout, a generic fallback is used.

## Production and Vercel

Build with `npm run build`; webpack writes static output to `public/`. Before a Vercel build, set `INNER_SITE_URL` to the **HTTPS URL** of the deployed inner site. The sibling `portfolio-inner-site/src/portfolio.config.json` must also be available to the build so the shell uses the shared profile. The Vercel build validates these requirements instead of silently deploying a blank screen or generic profile. When setting Vercel's Root Directory to this directory, ensure the build can include files outside the root directory, or otherwise provide the shared configuration as part of the build.

The shell serves static assets; the local Express server is not a production contact backend. Contact currently opens the visitor's email application.

## Attribution

The 3D experience is adapted from Henry Heffernan's [portfolio-website](https://github.com/henryjeff/portfolio-website). Preserve `LICENSE.md` and the original attribution when redistributing. Third-party models, audio, and other assets may have separate usage conditions and should be reviewed before public release.
