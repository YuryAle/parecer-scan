#!/usr/bin/env bash
# Monta o projeto Android (Capacitor) a partir do site e gera o APK assinado.
# Uso: montar-android.sh <versao>   (ex.: 1.1.0)
set -euo pipefail
VERSAO="${1:?versão}"
IFS=. read -r MA MI PA <<<"$VERSAO"
CODIGO=$(( MA * 10000 + MI * 100 + PA ))

# 1) arquivos do site
rm -rf www && mkdir www
cp -r index.html manifest.webmanifest css js icons www/

# 2) Capacitor
[ -f package.json ] || npm init -y >/dev/null
npm install --no-audit --no-fund \
  @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6 \
  @capacitor/filesystem@6 @capacitor/share@6 @capacitor/clipboard@6 @capacitor/browser@6
npm install --no-audit --no-fund -D @capacitor/assets@3
# biblioteca base do Capacitor (registerPlugin) antes do app
cp node_modules/@capacitor/core/dist/capacitor.js www/capacitor.js
sed -i 's#<script type="module" src="js/app.js"></script>#<script src="capacitor.js"></script>\n  <script type="module" src="js/app.js"></script>#' www/index.html
grep -q 'src="capacitor.js"' www/index.html
rm -rf android
npx cap add android

# 3) ícone e tela de abertura
npx capacitor-assets generate --android \
  --iconBackgroundColor '#12307a' --iconBackgroundColorDark '#12307a' \
  --splashBackgroundColor '#12307a' --splashBackgroundColorDark '#12307a'

# 4) permissões: câmera e pasta Documentos (Android 10 e anteriores)
MAN=android/app/src/main/AndroidManifest.xml
sed -i 's#<application#<application android:requestLegacyExternalStorage="true"#' "$MAN"
sed -i 's#</manifest>#    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />\n</manifest>#' "$MAN"

# 5) versão
GR=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${CODIGO}/; s/versionName \"[^\"]*\"/versionName \"${VERSAO}\"/" "$GR"

npx cap sync android

# 6) compila e assina
( cd android && chmod +x gradlew && ./gradlew --no-daemon assembleRelease )
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
IN=android/app/build/outputs/apk/release/app-release-unsigned.apk
"$BT/zipalign" -f -p 4 "$IN" alinhado.apk
"$BT/apksigner" sign --ks assinatura/camed-scan.p12 --ks-type PKCS12 --ks-key-alias camedscan \
  --ks-pass env:SENHA_ASSINATURA --key-pass env:SENHA_ASSINATURA --out CAMED-Scan.apk alinhado.apk
"$BT/apksigner" verify CAMED-Scan.apk
ls -la CAMED-Scan.apk
