docker compose build
docker compose up -d


cd /srv/nexus/aura

git status

git add .

git commit -m "fix: estabilizar cache API, claims honestos y mejoras UI"

git push origin main

git status