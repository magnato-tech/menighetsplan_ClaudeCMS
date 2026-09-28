#!/bin/bash
set -euo pipefail

# Menighets-CMS har ingen npm-avhengigheter (se CLAUDE.md punkt 4/11: "ingen
# npm-pakker og ingen rammeverk"), så det er ingenting å installere. Denne
# hooken bekrefter bare at Node.js-versjonen i miljøet oppfyller kravet i
# package.json ("engines": { "node": ">=20" }), slik at `npm test`/`node --test`
# og `node server.js` fungerer fra første stund i en Claude Code on the web-økt.

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js $(node --version) er for gammel – prosjektet krever >=20." >&2
  exit 1
fi

echo "Node.js $(node --version) OK, ingen avhengigheter å installere."
