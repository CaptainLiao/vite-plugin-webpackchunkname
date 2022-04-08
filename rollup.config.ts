import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

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
  plugins: [terser({ format: { comments: false } }), typescript()],
}
