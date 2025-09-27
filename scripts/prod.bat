@echo off
echo 🚀 Iniciando entorno de PRODUCCIÓN...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
echo ✅ Aplicación ejecutándose en producción
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f