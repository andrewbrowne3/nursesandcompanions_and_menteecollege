#!/bin/bash
#
# Deploy the Nurses Express dashboard (static build) to the nginx web root.
# The dashboard is NOT docker/systemd — it's static files served by host nginx
# from $TARGET. Deploy = build, then replace the files there.
#
# The web root is root-owned, so the file operations use sudo (passwordless
# sudo is configured for user 'ab').

set -e  # Exit immediately if a command exits with a non-zero status

TARGET="/var/www/menteecollegedashboard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Optional: bring the repo up to date before building.
# git pull || { echo "Failed to pull latest changes"; exit 1; }

echo "==> Building app (CI=false so lint warnings don't fail the build)..."
# react-scripts build occasionally exits non-zero with no error right after
# "Creating an optimized production build..." — a known transient flake. Retry once.
build_ok=false
for attempt in 1 2 3; do
    if CI=false npm run build; then
        build_ok=true
        break
    fi
    echo "   build attempt $attempt failed (likely a transient flake); retrying..."
    sleep 2
done
if [ "$build_ok" != true ]; then
    echo "Build failed after 3 attempts — not deploying."
    exit 1
fi

echo "==> Clearing old build assets in $TARGET..."
sudo rm -rf "$TARGET/static"
sudo find "$TARGET" -maxdepth 1 -type f -delete

echo "==> Copying new build to $TARGET..."
sudo cp -rp build/. "$TARGET/" || { echo "Failed to copy files to server"; exit 1; }

DEPLOYED=$(grep -o 'main\.[a-z0-9]*\.js' "$TARGET/index.html" | head -1)
echo "==> Deployment complete. Live bundle: $DEPLOYED"
echo "    (Hard-refresh the browser — Ctrl/Cmd+Shift+R — to bypass cache.)"
