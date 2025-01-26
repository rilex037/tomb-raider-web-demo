# Run the app
start-dev:
	@echo "Starting development environment..."
	@docker compose -f docker/docker-compose.yml down --remove-orphans
	@docker compose -f docker/docker-compose.yml up --build -d
