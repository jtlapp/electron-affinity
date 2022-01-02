# test in separate electron instances
node node_modules/.bin/electron-mocha build/test/test_single_api.js --timeout 8000
node node_modules/.bin/electron-mocha build/test/test_two_windows.js --timeout 8000