import dts from 'rollup-plugin-dts';

export default {
  input: 'dist/mags-prescription-list/mags/index.js',
  output: {
    file: 'dist/mags-prescription-list/mags/index.d.ts',
    format: 'esm',
  },
  plugins: [dts({ tsconfig: 'wrappers/components/mags-prescription-list/tsconfig.custom-element.json' })],
};
