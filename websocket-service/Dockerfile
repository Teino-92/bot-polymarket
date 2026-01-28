FROM denoland/deno:alpine-2.1.4

# Créer le répertoire de l'app
WORKDIR /app

# Copier les fichiers
COPY . .

# Créer le répertoire pour les logs
RUN mkdir -p /app/logs

# Exposer le port
EXPOSE 8000

# Healthcheck pour vérifier que le service tourne
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD deno eval "try { await fetch('http://localhost:8000/health'); Deno.exit(0); } catch { Deno.exit(1); }"

# Démarrer le service
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-sys", "index.ts"]
