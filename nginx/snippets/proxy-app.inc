# Upstream proxy definition to the NestJS application container
proxy_pass http://app:4567;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;

proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;

# Overwrite (never append to) X-Forwarded-For to prevent IP spoofing in NAT environments
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;

proxy_connect_timeout 60s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;

limit_req zone=api_zone burst=60 nodelay;
limit_req_status 429;
limit_conn conn_zone 40;
