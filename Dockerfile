FROM nginx:1.25-alpine-slim
COPY dist /usr/share/nginx/html/wiremock

COPY <<"EOF" /etc/nginx/templates/default.conf.template
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    location / {
        proxy_pass   ${WIREMOCK_SERVER};
        
		proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /wiremock {
        root   /usr/share/nginx/html;
        try_files $uri $uri/ /wiremock/index.html;
    }
}
EOF

COPY <<EOF /server-config.js
(function () {
    window.appConfig = {
        defaultServer: [
            {
                id: '0',
                name: 'Server0',
                url: '/.',
                desc: 'wiremock server run with docker compose'
            }
        ]
    }
})()
EOF

COPY <<"EOF" /pre-process.sh
if [ -n "$WIREMOCK_SERVER" ]; then
  cp /server-config.js /usr/share/nginx/html/wiremock/config.js;
else
  sed -i '/${WIREMOCK_SERVER}/'d /etc/nginx/templates/default.conf.template;
fi
EOF

RUN sed -i '/^set -e$/r /pre-process.sh' /docker-entrypoint.sh
