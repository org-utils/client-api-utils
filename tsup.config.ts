import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  target: 'es2022',
  splitting: false,
  treeshake: true,
  minify: true,
  outDir: 'dist',
  // Every entry is bundled independently so importing "./client" can never
  // pull in "./server" (or vice versa) even transitively.
  bundle: true,
});
