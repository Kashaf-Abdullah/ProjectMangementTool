# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Production environment

Set `VITE_API_URL` to the deployed backend API URL (for example,
`https://api.example.com/api`). The WebSocket endpoint defaults to the same
backend host at `/ws`. If the WebSocket server uses a different host, set
`VITE_WS_URL` to its endpoint (for example, `wss://api.example.com/ws`).

The frontend host must support forwarding WebSocket upgrades if using a
same-origin endpoint. Vercel-hosted frontend deployments should point
`VITE_WS_URL` to a separately hosted backend that supports persistent
WebSocket connections, then rebuild and redeploy the frontend.

`vercel.json` rewrites frontend routes to `index.html`, so React Router pages
also load when opened directly or refreshed in a Vercel deployment.
