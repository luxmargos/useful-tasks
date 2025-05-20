import { defineConfig } from 'tsup';
import * as packageJson from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: 'src/index.ts',
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  minify: true,
  bundle: true,
  external: [/.*\.test\.tsx?$/, /.*\.spec\.tsx?$/, /__tests__/, '__mocks__'],
});
