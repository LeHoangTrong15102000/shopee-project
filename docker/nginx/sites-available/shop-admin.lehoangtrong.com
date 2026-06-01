# =============================================================================
# VPS system nginx server block — shop-admin.lehoangtrong.com (shopee-admin)
#
# This is a version-controlled copy of the VPS host nginx config.
# Deploy to: /etc/nginx/sites-available/shop-admin.lehoangtrong.com
# Enable with: ln -s /etc/nginx/sites-available/shop-admin.lehoangtrong.com \
#                     /etc/nginx/sites-enabled/shop-admin.lehoangtrong.com
# Reload: nginx -t && systemctl reload nginx
# ufw: NO changes needed — only 22/tcp and Nginx Full (80/443) are open.
# TLS: managed by certbot (see certbot command below).
#   certbot --nginx -d shop-admin.lehoangtrong.com
# =============================================================================

server {
    listen 80;
    server_name shop-admin.lehoangtrong.com;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # TLS configuration is added by certbot on port 443
}
