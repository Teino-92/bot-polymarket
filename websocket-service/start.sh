#!/bin/sh

# Start WireGuard if config exists
if [ -f /etc/wireguard/wg0.conf ]; then
    echo "🔒 Starting WireGuard VPN..."
    wg-quick up wg0

    # Verify VPN connection
    echo "🌍 Checking public IP..."
    PUBLIC_IP=$(wget -qO- ifconfig.me)
    echo "✅ Connected via IP: $PUBLIC_IP"
else
    echo "⚠️  No WireGuard config found, running without VPN"
fi

# Start Deno application
echo "🚀 Starting WebSocket service..."
deno run --allow-net --allow-env index.ts
