cd ~/sound-system-hardening-new
git apply /path/to/remove-tirets-quadratins.patch
git add -A && git commit -m "fix: typos"
git push origin main
# Attendre ~5 min pour Netlify → soundsystemhardening.fr live ✅