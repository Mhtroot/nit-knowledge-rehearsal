# Shared by http.conf and https.conf (included inside a server block).

# Allow uploads up to 25MB (news images, workshop posters, banners)
client_max_body_size 25m;

# Static uploaded images & media caching
location /assets/ {
    expires 7d;
    add_header Cache-Control "public, no-transform";
    include /etc/nginx/snippets/security-headers.inc;
    include /etc/nginx/snippets/proxy-app.inc;
}

# Swagger UI & API documentation (relaxed headers to allow interactive API console)
location /admin-dash/ {
    client_max_body_size 25m;
    include /etc/nginx/snippets/proxy-app.inc;
}

# Block access to hidden files (.git, .env, etc.)
location ~ /\. {
    deny all;
}

# All application endpoints and frontend pages
location / {
    include /etc/nginx/snippets/security-headers.inc;
    include /etc/nginx/snippets/proxy-app.inc;
}
