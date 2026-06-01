# =============================================================================
# VPS system nginx server block — api-ecom.lehoangtrong.com (shopee-api)
#
# This is a version-controlled copy of the VPS host nginx config.
# Deploy to: /etc/nginx/sites-available/api-ecom.lehoangtrong.com
# Enable with: ln -s /etc/nginx/sites-available/api-ecom.lehoangtrong.com \
#                     /etc/nginx/sites-enabled/api-ecom.lehoangtrong.com
# Reload: nginx -t && systemctl reload nginx
# ufw: NO changes needed — only 22/tcp and Nginx Full (80/443) are open.
# TLS: managed by certbot (see certbot command below).
#   certbot --nginx -d api-ecom.lehoangtrong.com
# =============================================================================

server {
    listen 80;
    server_name api-ecom.lehoangtrong.com;

    location / {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;

        # WebSocket upgrade headers (required for socket.io)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # TLS configuration is added by certbot on port 443
}
