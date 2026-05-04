<!-- this command will create multiple tenants -->
docker-compose exec backend python manage.py init_setup \
--tenant "Second Corp" \
--subdomain "second" \
--username "admin_second" \
--password "password456"


