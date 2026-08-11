#!/bin/bash
#
# 拡張子は .jpg でも中身が JPEG ではない画像を、その場で JPEG に変換する（macOS 専用）
# sharp (libheif) が読めない HEIC などが混ざったときに使う
#
#   ./generator/convert2jpg.sh [対象ディレクトリ]
#
set -euo pipefail

dir="${1:-src/image/photo-original}"
converted=0
failed=0

for file in "$dir"/*.jpg; do
  mime="$(file -b --mime-type "$file")"

  if [ "$mime" = "image/jpeg" ]; then
    continue
  fi

  echo "converting: $file (${mime})"

  sips -s format jpeg -s formatOptions best "$file" --out "$file" >/dev/null 2>&1 || true

  # sips は変換できなくても終了コード 0 を返すので、結果を見て判定する
  if [ "$(file -b --mime-type "$file")" = "image/jpeg" ]; then
    converted=$((converted + 1))
  else
    echo "  FAILED: $file"
    failed=$((failed + 1))
  fi
done

echo "done. (converted: ${converted} / failed: ${failed})"
