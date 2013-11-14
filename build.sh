#!/bin/sh

APP_KEY=$(cat .appkey)
ZIP_EXCLUDE="*.DS_Store *.swo *.swp src/*~ src/js/*~ src/css/*~"

if [[ -z "$APP_KEY" ]]; then
    echo "dropbox app key is missing"
    exit 1
fi

if [[ ! -f "tool/BookmarkSpell.pem" ]]; then
    echo "BookmarkSpell.pem is missing, this is required for build."
    exit 1
fi

sed -i ".bak" "s/APP_KEY_PLACEHOLDER/$APP_KEY/g" src/js/background.js
tool/crxtool.sh src tool/BookmarkSpell.pem build/BookmarkSpell.crx
zip -r src.zip src -x $ZIP_EXCLUDE && mv src.zip build/forChromeStore.zip

exit 0