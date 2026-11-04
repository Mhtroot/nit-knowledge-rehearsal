#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push

echo "Running seed script..."
# Run the compiled JavaScript version of your seed script
node dist/core/facultyAndGroupInit.js

echo "Starting application..."
exec node dist/main.js