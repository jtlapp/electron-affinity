# test in separate electron instances
node node_modules/.bin/electron-mocha build/test/test_single_expose.js --timeout 8000
node node_modules/.bin/electron-mocha build/test/test_multi_expose.js --timeout 8000