start-services:
	- ./docker/scripts/init.sh
stop-services:
	- docker compose down
build:
	- docker build -f ./Dockerfile-prod -t ms-bot-ben-container:latest .
start:
	- docker run --name ms-bot-ben-container -p 5010:80 -d ms-bot-ben-container:latest
exec:
	- docker exec -it ms-bot-ben-container /bin/sh
logs:
	- docker logs -f --tail 50 --timestamps ms-bot-ben-container
