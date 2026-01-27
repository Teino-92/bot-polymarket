# Dockerfile pour WebSocket Service avec WireGuard support
FROM denoland/deno:alpine-1.40.0

# Installer WireGuard tools
RUN apk add --no-cache wireguard-tools iptables

WORKDIR /app

# Copy application files
COPY . .

# Copy WireGuard config if provided
# Add your Surfshark WireGuard config as wg0.conf
COPY wg0.conf /etc/wireguard/wg0.conf 2>/dev/null || true

# Cache dependencies
RUN deno cache index.ts

# Startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
