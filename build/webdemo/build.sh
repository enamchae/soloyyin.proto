rm -rf .webdemo-dist/*
# static
mkdir -p .webdemo-dist
cp -r webdemo/static/* .webdemo-dist
# webpack
bash build/webdemo/copy-lib.sh
npx webpack --config build/webdemo/webpack.config.js