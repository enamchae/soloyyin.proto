rm -rf .webext-dist/*
# static
mkdir -p .webext-dist
cp -r webext/static/* .webext-dist
# webpack
npx webpack --config build/webext/webpack.config.js