#!/usr/bin/env bash
# Run this once from your Terminal to download all guide images locally.
# Usage:  bash download_images.sh
# Images are saved to src/assets/images/ — commit them afterwards.

set -e
DIR="$(dirname "$0")/src/assets/images"
mkdir -p "$DIR"
BASE="https://upload.wikimedia.org/wikipedia/commons/thumb"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

dl() {
  local key=$1 url=$2
  local out="$DIR/$key.jpg"
  if [ -f "$out" ] && [ "$(wc -c < "$out")" -gt 10000 ]; then
    echo "  $key  already OK"
    return
  fi
  printf "  %-22s " "$key"
  local code size
  code=$(curl -sL -w "%{http_code}" \
    -H "User-Agent: $UA" \
    -H "Referer: https://en.wikipedia.org/" \
    -H "Accept: image/jpeg,image/*" \
    "$url" -o "$out")
  size=$(wc -c < "$out" | tr -d ' ')
  if [ "$code" = "200" ] && [ "$size" -gt 10000 ]; then
    echo "✓  ${size} B"
  else
    echo "✗  HTTP $code (${size} B) — will fall back to remote URL in app"
    rm -f "$out"
  fi
  sleep 1
}

echo "Downloading guide images to $DIR ..."
echo ""

dl roman_forum       "$BASE/6/6a/Foro_Romano_Musei_Capitolini_Roma.jpg/800px-Foro_Romano_Musei_Capitolini_Roma.jpg"
dl trevi             "$BASE/c/c7/Trevi_Fountain_-_Roma.jpg/800px-Trevi_Fountain_-_Roma.jpg"
dl creation_of_adam  "$BASE/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/800px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg"
dl colosseum         "$BASE/d/de/Colosseo_2020.jpg/800px-Colosseo_2020.jpg"
dl apollo_daphne     "$BASE/a/ab/Apollo_and_Daphne_%28Bernini%29_%28cropped%29.jpg/800px-Apollo_and_Daphne_%28Bernini%29_%28cropped%29.jpg"
dl pantheon          "$BASE/7/7b/Pantheon_%28Rome%29_-_Right_side_and_front.jpg/800px-Pantheon_%28Rome%29_-_Right_side_and_front.jpg"
dl st_peters         "$BASE/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/800px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg"
dl birth_of_venus    "$BASE/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/800px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg"
dl david             "$BASE/b/bb/%27David%27_by_Michelangelo_Fir_JBU004.jpg/800px-%27David%27_by_Michelangelo_Fir_JBU004.jpg"
dl gates_of_paradise "$BASE/3/3a/Paradies_tuer_florenz.jpg/800px-Paradies_tuer_florenz.jpg"
dl pitti_palace      "$BASE/6/6a/Palazzo_Pitti_nel_tardo_pomeriggio.jpg/800px-Palazzo_Pitti_nel_tardo_pomeriggio.jpg"
dl fra_angelico      "$BASE/b/bc/Fra_Angelico_-_Annunciation.jpg/800px-Fra_Angelico_-_Annunciation.jpg"
dl florence_duomo    "$BASE/c/c7/Cattedrale_di_Santa_Maria_del_Fiore_%E2%80%93_Il_Duomo_di_Firenze.jpg/800px-Cattedrale_di_Santa_Maria_del_Fiore_%E2%80%93_Il_Duomo_di_Firenze.jpg"
dl santa_croce       "$BASE/2/2c/Basilica_di_Santa_Croce_%2812437%29.jpg/800px-Basilica_di_Santa_Croce_%2812437%29.jpg"
dl val_dorcia        "$BASE/b/b3/I_cipressi_della_Val_D%27Orcia.jpg/800px-I_cipressi_della_Val_D%27Orcia.jpg"
dl siena_campo       "$BASE/0/0a/Siena5.jpg/800px-Siena5.jpg"
dl siena_duomo       "$BASE/7/7c/Duomo_di_Siena-9635.jpg/800px-Duomo_di_Siena-9635.jpg"

echo ""
echo "Done! Now run:  git add src/assets/images && git commit -m 'Add bundled guide images'"
