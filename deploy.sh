#!/bin/bash

# Build the frontend
cd frontend
npm install
npm run build

# Move the build to the root directory
cd ..
rm -rf dist
mv frontend/build dist

# Create a simple package.json for Heroku
cat > package.json << EOL
{
  "name": "tigerpop-marketplace-frontend",
  "version": "1.0.0",
  "engines": {
    "node": "20.x"
  },
  "scripts": {
    "start": "echo 'Starting NGINX...'"
  }
}
EOL

# Create Procfile for NGINX
echo "web: bin/start-nginx-static" > Procfile

# Ensure config directory exists
mkdir -p config

# Copy NGINX configuration
cat > config/nginx.conf.erb << EOL
daemon off;
worker_processes auto;

events {
    use epoll;
    accept_mutex on;
    worker_connections 1024;
}

http {
    gzip on;
    gzip_comp_level 4;
    gzip_min_length 1100;
    gzip_types text/plain text/css application/javascript application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    server_tokens off;

    log_format l2met 'measure#nginx.service=\$request_time request_id=\$http_x_request_id';
    access_log /tmp/nginx.access.log l2met;
    error_log /tmp/nginx.error.log;

    include mime.types;
    default_type application/octet-stream;
    sendfile on;

    server {
        listen <%= ENV["PORT"] %>;
        server_name _;
        root /app/dist;
        index index.html;

        location / {
            try_files \$uri \$uri/ /index.html;
            add_header Cache-Control "no-store, no-cache";
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }

        error_page 404 /index.html;
    }
}
EOL

# Commit and push to Heroku
git add .
git commit -m "Update NGINX configuration to use /tmp for logs"
git push -f heroku main 