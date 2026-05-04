#!/bin/sh

# Wait for the database to be ready
until nc -z $DB_HOST $DB_PORT; do
  echo "Waiting for the database to be ready..."
  sleep 1
done

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Start the Django development server
exec "$@"
