#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Switching to branch main..."
#git checkout main || { echo "Failed to switch to branch main"; exit 1; }

#echo "Pulling latest changes..."
#git pull || { echo "Failed to pull latest changes"; exit 1; }

echo "Building app..."
npm run build || { echo "Build failed"; exit 1; }

echo "Deploying files to server..."
cp -rp build/* /var/www/nursesandcompanions/ || { echo "Failed to copy files to server"; exit 1; }

echo "Deployment completed successfully!"

