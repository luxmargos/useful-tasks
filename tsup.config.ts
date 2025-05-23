import { defineConfig } from 'tsup';

type BuildMode = 'production' | 'development';
const buildMode:BuildMode = (process.env.BUILD_MODE || 'development') as BuildMode;

if(buildMode !== 'production' && buildMode !== 'development'){
  throw new Error('BUILD_MODE must be "production" or "development"');
}

const isProduction = buildMode === 'production';

console.log('\n\n## BUILD_MODE', buildMode, '\n\n');

export default defineConfig({
  entry: ['src/index.ts'],
  dts: 'src/index.ts',
  splitting: false,
  sourcemap: !isProduction,
  clean: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  minify: isProduction,
  bundle: true,
  external: [/.*\.test\.tsx?$/, /.*\.spec\.tsx?$/, /__tests__/, '__mocks__'],
  esbuildOptions(options, context) {
    options.define = {
      'process.env.BUILD_MODE': buildMode,
    };
  },
});
