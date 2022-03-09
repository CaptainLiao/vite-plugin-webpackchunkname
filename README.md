## Features

Use `webpackChunkName` config in `vue-router` by vite as well as `webpack` do.

> ℹ️ **Only support for Vite 2.**

## Install

Install the package from npm (or yarn, or pnpm).

```bash
npm install --save-dev vite-plugin-webpackchunkname
```

### Basic usage

Add it to `vite.config.ts`

```ts
// vite.config.ts
import { manualChunksPlugin } from 'vite-plugin-webpackchunkname'
// Other dependencies...

export default defineConfig({
  plugins: [
    manualChunksPlugin(),
  ]
})
```

## License

MIT License © 2022 [CaptainLiao](https://github.com/CaptainLiao)