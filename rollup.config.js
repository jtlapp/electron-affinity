import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import * as fs from 'fs';
import * as path from 'path';

const config = [];
const scriptDir = path.join(__dirname, "test/client");

fs.readdirSync(scriptDir).forEach(fileName => {
	if (fileName.endsWith(".ts")) {
		const scriptName = fileName.substring(0, fileName.length - 3);
		config.push({
			input: `test/client/${scriptName}.ts`,
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
					tsconfig: "test/client/tsconfig.json"
				}),
			]
		});
	}
});

export default config;