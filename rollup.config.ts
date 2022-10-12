import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import externals from 'rollup-plugin-node-externals'

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
  plugins: [externals(), terser({ format: { comments: false } }), typescript()],
}
