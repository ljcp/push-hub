docker run -d \
  --name push-hub \
  --env-file .env \
  -v "${PWD}/certs:/certs:ro" \
  -p 3000:3000 \
  push-hub

  