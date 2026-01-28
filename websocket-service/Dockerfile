FROM denoland/deno:alpine-2.1.4

# Créer le répertoire de l'app
WORKDIR /app

# Copier les fichiers
COPY . .

# Créer le répertoire pour les logs
RUN mkdir -p /app/logs

# Créer un script de démarrage qui configure le DNS
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "nameserver 1.1.1.1" > /etc/resolv.conf' >> /start.sh && \
    echo 'echo "nameserver 8.8.8.8" >> /etc/resolv.conf' >> /start.sh && \
    echo 'exec deno run --allow-net --allow-env --allow-read --allow-sys index.ts' >> /start.sh && \
    chmod +x /start.sh

# Exposer le port (note: avec network_mode: service:vpn, ce port sera sur le container VPN)
EXPOSE 8000

# Healthcheck pour vérifier que le service tourne
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD deno eval "try { await fetch('http://localhost:8000/health'); Deno.exit(0); } catch { Deno.exit(1); }"

# Démarrer le service avec le script
CMD ["/start.sh"]
