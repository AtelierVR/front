#!/bin/sh
set -e

# NEXT_PUBLIC_* vars are baked in at build time with placeholder values (====VARNAME====).
# This script patches the built JS bundle at container startup to replace
# placeholders with actual environment variable values.

echo "[entrypoint] Patching NEXT_PUBLIC_* variables..."

find /app/.next -type f -name "*.js" | while IFS= read -r file; do
    placeholders=$(grep -oE '====NEXT_PUBLIC_[A-Z0-9_]+====' "$file" 2>/dev/null | sort -u) || true
    if [ -z "$placeholders" ]; then
        continue
    fi
    for placeholder in $placeholders; do
        varname=$(echo "$placeholder" | sed 's/====//g')
        value=$(printenv "$varname" || true)
        if [ -n "$value" ]; then
            sed -i "s|$placeholder|$value|g" "$file"
            echo "[entrypoint] $varname patched in $(basename "$file")"
        fi
    done
done

echo "[entrypoint] Done."
exec node server.js
