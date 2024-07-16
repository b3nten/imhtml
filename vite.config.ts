import { defineConfig } from 'vite'
import UnpluginIsolatedDecl from 'unplugin-isolated-decl/vite'
export default defineConfig({
	plugins: [UnpluginIsolatedDecl()],
	build: {
		lib: {
			formats: ['es'],
			entry: 'src/mod.ts',
			fileName: 'mod'
		},
		outDir: './.build',
		minify: false,
	},
	esbuild: {
		target: 'es2022',
	}
})