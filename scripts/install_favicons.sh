#!/bin/bash
set -e
DEST=~/sound-system-hardening-new/public

echo "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAKXElEQVR4nHWXTYwl51XHf/erql69" | base64 -d > "$DEST/favicon-32.png" 2>/dev/null || true
python3 << 'PYEOF'
import base64, os, urllib.request

dest = os.path.expanduser("~/sound-system-hardening-new/public")

# Lire les fichiers depuis le logo source
from PIL import Image

logo = os.path.expanduser("~/Desktop/SoundSystem/SoundSystemHardening-logo.png")
img = Image.open(logo).convert("RGBA")

sizes = [16, 32, 48, 180, 192, 512]
for size in sizes:
    out = os.path.join(dest, f"favicon-{size}.png")
    img.resize((size, size), Image.LANCZOS).save(out)
    print(f"✅ favicon-{size}.png")

ico = img.resize((32, 32), Image.LANCZOS)
ico.save(os.path.join(dest, "favicon.ico"), format="ICO", sizes=[(16,16),(32,32),(48,48)])
print("✅ favicon.ico")
print("\n🟢 Favicons générés dans public/")
PYEOF
