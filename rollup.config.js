import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import * as fs from 'fs';
import * as path from 'path';

const config = [];
const scriptDir = path.join(__dirname, "test/window-scripts");

fs.readdirSync(scriptDir).forEach(fileName => {
	if (fileName.endsWith(".ts")) {
		const scriptName = fileName.substring(0, fileName.length - 3);
		config.push({
			input: `test/window-scripts/${scriptName}.ts`,
			output: {
				sourcemap: true,
				format: 'cjs',
				file: `build/test/bundle/${scriptName}.js`
			},
			plugins: [
				commonjs(),
				typescript({
					sourceMap: true,
					inlineSources: true,
					tsconfig: "test/window-scripts/tsconfig.json"
				}),
			]
		});
	}
});

export default config;