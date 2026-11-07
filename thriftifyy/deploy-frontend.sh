
#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="ghcr.io/afza-khursheed123/e-commerce-frontend:${1:?Image tag required}"
NAME="ecommerce-frontend"
BACKUP="${NAME}-rollback"
CANDIDATE="${NAME}-candidate"
NETWORK="ecommerce-network"

docker info >/dev/null

echo "Pulling frontend image..."
docker pull "$IMAGE"

echo "Testing candidate frontend..."
docker rm -f "$CANDIDATE" 2>/dev/null || true

docker run -d \
  --name "$CANDIDATE" \
  --network "$NETWORK" \
  -p 127.0.0.1:8081:80 \
  "$IMAGE"

candidate_ok=false
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:8081/ &&
     curl -fsS -o /dev/null http://127.0.0.1:8081/api/products; then
    candidate_ok=true
    break
  fi
  sleep 2
done

docker rm -f "$CANDIDATE"

if [ "$candidate_ok" != true ]; then
  echo "Candidate failed. Existing frontend untouched."
  exit 1
fi

echo "Candidate healthy. Switching frontend..."

docker rm -f "$BACKUP" 2>/dev/null || true

docker stop "$NAME"
docker rename "$NAME" "$BACKUP"

rollback() {
  echo "Deployment failed. Restoring previous frontend..."
  docker rm -f "$NAME" 2>/dev/null || true
  docker rename "$BACKUP" "$NAME"
  docker start "$NAME"
}

trap rollback ERR

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  --network "$NETWORK" \
  -p 80:80 \
  "$IMAGE"

healthy=false
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1/ &&
     curl -fsS -o /dev/null http://127.0.0.1/api/products; then
    healthy=true
    break
  fi
  sleep 2
done

if [ "$healthy" != true ]; then
  echo "Frontend health check failed."
  false
fi

trap - ERR

echo "Frontend deployed successfully."
echo "Previous frontend preserved as $BACKUP"

