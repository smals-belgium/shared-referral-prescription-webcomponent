import dts from 'rollup-plugin-dts';

export default {
  input: 'dist/mags-prescription-details/mags/index.js',
  output: {
    file: 'dist/mags-prescription-details/mags/index.d.ts',
    format: 'esm',
  },
  plugins: [dts({ tsconfig: 'wrappers/components/mags-prescription-details/tsconfig.custom-element.json' })],
};
