#!/bin/sh
set -e

# Соберём все сертификаты из /anchors (смонтировано из хоста) в один PEM-бандл
BUNDLE=/certs/extra-ca-bundle.pem
if [ -d /anchors ]; then
  echo "# building CA bundle from /anchors into $BUNDLE"
  rm -f "$BUNDLE"
  # учтём и .crt, и .pem (если есть)
  for f in /anchors/*; do
    case "$f" in
      *.crt|*.pem)
        # если вдруг DER — конвертни заранее на хосте в PEM (см. примечание ниже)
        cat "$f" >> "$BUNDLE"
        printf "\n" >> "$BUNDLE"
      ;;
    esac
  done
fi

# Если переменная не задана в compose — подстрахуемся здесь
export NODE_EXTRA_CA_CERTS=${NODE_EXTRA_CA_CERTS:-/certs/extra-ca-bundle.pem}

# Запускаем приложение
exec node dist/main.js
