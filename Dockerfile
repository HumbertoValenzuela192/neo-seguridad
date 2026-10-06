FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js portal-server.js admin.html index.html directory.html directory.js recover.html recover.js sync.js styles.css theme-neo.css theme-tigrr.css tigrr.css tigrr.html tigrr.png neo-globo.png neo-globo-icon.png a2791a37-6fe2-413d-9f5a-526532134dcc.jpg ./
COPY assets ./assets
EXPOSE 3000
CMD ["node", "server.js"]
