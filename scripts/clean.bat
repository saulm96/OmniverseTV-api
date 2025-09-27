@echo off
echo 🧹 Limpiando Docker...
docker-compose down --volumes --rmi all
docker system prune -f
docker volume prune -f
echo ✅ Limpieza completada