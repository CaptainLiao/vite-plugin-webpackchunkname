import banner2 from 'rollup-plugin-banner2'
import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'

// 版权信息配置
const ResolveBanner = () => {
  return `/**\n * name: ${pkg.name}\n * version: v${pkg.version}\n * author: ${pkg.author}\n */\n`
}

const outputOpt = {
  format: 'cjs',
  sourcemap: true,
  exports: 'auto',
}

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `dist/vite-plugin-webpackchunkname.js`,
      ...outputOpt,
    },
  ],
  external: ['rollup', 'fs', 'path'],
  plugins: [
    typescript(),
    banner2(ResolveBanner, {
      sourcemap: true,
    }),
  ],
}
