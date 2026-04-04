# ---------- Stage 1: Build menteecollegedashboard ----------
FROM node:18-alpine AS dashboard-build
WORKDIR /app
COPY menteeCollegePortal/menteecollegedashboard/package.json menteeCollegePortal/menteecollegedashboard/package-lock.json ./
RUN npm ci
COPY menteeCollegePortal/menteecollegedashboard/ .
RUN npm run build

# ---------- Stage 2: Build nursesandcompanions ----------
FROM node:18-alpine AS nurses-build
WORKDIR /app
COPY nursesandcompanions/package.json nursesandcompanions/package-lock.json ./
RUN npm ci
COPY nursesandcompanions/ .
RUN npm run build

# ---------- Stage 3: Nginx with all assets ----------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/ssl-params.conf /etc/nginx/ssl-params.conf
COPY nginx/conf.d/ /etc/nginx/conf.d/

# Copy React builds from previous stages
COPY --from=dashboard-build /app/build /usr/share/nginx/dashboard
COPY --from=nurses-build /app/build /usr/share/nginx/nurses

# Copy static HTML site
COPY MenteeCollege/ /usr/share/nginx/menteecollege

EXPOSE 80 443
