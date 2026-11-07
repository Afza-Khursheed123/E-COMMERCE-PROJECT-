
#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="ghcr.io/afza-khursheed123/e-commerce-backend:${1:?Image tag required}"
NAME="ecommerce-backend"
ENV_FILE="/home/ec2-user/ecommerce-config/backend.env"
BACKUP="${NAME}-rollback"

docker info >/dev/null
test -f "$ENV_FILE"

echo "Pulling new backend image..."
docker pull "$IMAGE"

echo "Testing candidate backend on port 3001..."
docker rm -f "${NAME}-candidate" 2>/dev/null || true
docker run -d \
  --name "${NAME}-candidate" \
  --env-file "$ENV_FILE" \
  -p 127.0.0.1:3001:3000 \
  "$IMAGE"

candidate_ok=false
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3001/products; then
    candidate_ok=true
    break
  fi
  sleep 2
done

docker rm -f "${NAME}-candidate"

if [ "$candidate_ok" != true ]; then
  echo "Candidate failed. Existing backend untouched."
  exit 1
fi

echo "Candidate healthy. Starting deployment..."
docker rm -f "$BACKUP" 2>/dev/null || true
docker stop "$NAME"
docker rename "$NAME" "$BACKUP"

rollback() {
  echo "Deployment failed. Restoring previous backend..."
  docker rm -f "$NAME" 2>/dev/null || true
  docker rename "$BACKUP" "$NAME"
  docker start "$NAME"
}

trap rollback ERR

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 3000:3000 \
  "$IMAGE"

healthy=false
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/products; then
    healthy=true
    break
  fi
  sleep 2
done

if [ "$healthy" != true ]; then
  echo "New backend failed health check."
  false
fi

trap - ERR
echo "Backend deployed successfully."
echo "Previous container preserved as $BACKUP"
