# =============================================================================
# VPS system nginx server block — lehoangtrong.com (shopee-web)
#
# This is a version-controlled copy of the VPS host nginx config.
# Deploy to: /etc/nginx/sites-available/lehoangtrong.com
# Enable with: ln -s /etc/nginx/sites-available/lehoangtrong.com \
#                     /etc/nginx/sites-enabled/lehoangtrong.com
# Reload: nginx -t && systemctl reload nginx
# ufw: NO changes needed — only 22/tcp and Nginx Full (80/443) are open.
# TLS: managed by certbot (see certbot command below).
#   certbot --nginx -d lehoangtrong.com -d www.lehoangtrong.com
# =============================================================================

server {
    listen 80;
    server_name lehoangtrong.com www.lehoangtrong.com;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # TLS configuration is added by certbot on port 443
}
