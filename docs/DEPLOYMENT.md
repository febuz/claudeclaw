# Deployment Guide

Complete guide for deploying ClaudeClaw in various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker & Docker Compose](#docker--docker-compose)
3. [Kubernetes](#kubernetes)
4. [Cloud Platforms](#cloud-platforms)
5. [Production Considerations](#production-considerations)
6. [Monitoring & Logging](#monitoring--logging)

---

## Local Development

### Prerequisites

- Node.js 18+ 
- npm 9+
- ANTHROPIC_API_KEY environment variable set

### Setup

```bash
git clone https://github.com/fillslava/claudeclaw.git
cd claudeclaw

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Run tests
npm test

# Start using CLI
npm start agent:register coordinator coordinator claude-opus-4-1
npm start queue:process
```

### Development Commands

```bash
# Watch mode
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Run specific tests
npm test -- orchestrator.test.ts

# Build only
npm run build
```

---

## Docker & Docker Compose

### Single Container

#### Build

```bash
docker build -t claudeclaw:latest .
```

#### Run

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=sk-... \
  -e LOG_LEVEL=info \
  claudeclaw:latest
```

#### With Volume Mount

```bash
docker run -it \
  -e ANTHROPIC_API_KEY=sk-... \
  -v $(pwd)/results:/app/results \
  -v $(pwd)/config:/app/config \
  claudeclaw:latest \
  node dist/cli.js queue:process
```

### Docker Compose (Full Stack)

#### Start Services

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-...

# Build and start
docker-compose up --build

# Or in background
docker-compose up -d

# View logs
docker-compose logs -f claudeclaw

# Stop services
docker-compose down
```

#### Service Endpoints

- **Main**: `http://localhost:3000`
- **Researcher MCP**: `http://localhost:3001`
- **Skills MCP**: `http://localhost:3002`

#### Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  claudeclaw:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./results:/app/results
      - ./config:/app/config
```

#### Cleanup

```bash
# Remove containers and volumes
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

---

## Kubernetes

### Prerequisites

- kubectl configured
- Kubernetes cluster running
- Container registry access (Docker Hub, ECR, etc.)

### Build and Push Docker Image

```bash
# Build image
docker build -t your-registry/claudeclaw:v1.0.0 .

# Push to registry
docker push your-registry/claudeclaw:v1.0.0
```

### Kubernetes Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claudeclaw
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: claudeclaw
  template:
    metadata:
      labels:
        app: claudeclaw
    spec:
      containers:
      - name: claudeclaw
        image: your-registry/claudeclaw:v1.0.0
        imagePullPolicy: IfNotPresent
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: claudeclaw-secrets
              key: api-key
        - name: LOG_LEVEL
          value: "info"
        ports:
        - containerPort: 3000
          name: api
        - containerPort: 3001
          name: researcher-mcp
        - containerPort: 3002
          name: skills-mcp
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config
          mountPath: /app/config
        - name: results
          mountPath: /app/results
      volumes:
      - name: config
        configMap:
          name: claudeclaw-config
      - name: results
        emptyDir: {}
```

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: claudeclaw-svc
  namespace: default
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
    name: api
  - port: 3001
    targetPort: 3001
    name: researcher-mcp
  - port: 3002
    targetPort: 3002
    name: skills-mcp
  selector:
    app: claudeclaw
```

### Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic claudeclaw-secrets \
  --from-literal=api-key=sk-...

# Create ConfigMap
kubectl create configmap claudeclaw-config \
  --from-file=./config/

# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get pods -l app=claudeclaw
kubectl logs -l app=claudeclaw

# Port forward for local access
kubectl port-forward svc/claudeclaw-svc 3000:3000
```

---

## Cloud Platforms

### AWS ECS

1. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag claudeclaw:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/claudeclaw:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/claudeclaw:latest
   ```

2. **Create ECS Task Definition** (JSON)
   ```json
   {
     "family": "claudeclaw",
     "networkMode": "awsvpc",
     "containerDefinitions": [
       {
         "name": "claudeclaw",
         "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/claudeclaw:latest",
         "portMappings": [
           { "containerPort": 3000, "protocol": "tcp" }
         ],
         "environment": [
           { "name": "LOG_LEVEL", "value": "info" }
         ],
         "secrets": [
           {
             "name": "ANTHROPIC_API_KEY",
             "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:claudeclaw/api-key"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/claudeclaw",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512"
   }
   ```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/claudeclaw

# Deploy
gcloud run deploy claudeclaw \
  --image gcr.io/PROJECT_ID/claudeclaw \
  --platform managed \
  --region us-central1 \
  --set-env-vars ANTHROPIC_API_KEY=sk-... \
  --memory 512Mi \
  --cpu 1
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create claudeclaw

# Set config
heroku config:set ANTHROPIC_API_KEY=sk-...

# Deploy
git push heroku master

# View logs
heroku logs --tail
```

---

## Production Considerations

### Environment Variables

**Essential:**
- `ANTHROPIC_API_KEY`: Anthropic API key (secrets manager)
- `NODE_ENV`: Set to `production`
- `LOG_LEVEL`: Set to `warn` or `error`

**Optional:**
- `MAX_CONCURRENT_AGENTS`: Default 4
- `TASK_TIMEOUT_MS`: Default 300000
- `RETRY_ATTEMPTS`: Default 3

### Security

1. **Secrets Management**
   ```bash
   # Use environment-specific secrets
   export ANTHROPIC_API_KEY=$(aws secretsmanager get-secret-value --secret-id claudeclaw/api-key --query SecretString --output text)
   ```

2. **Network Security**
   - Use private networks for internal MCP communication
   - Enable TLS for external APIs
   - Use network policies to restrict pod-to-pod traffic

3. **RBAC & Access Control**
   ```bash
   # Kubernetes RBAC
   kubectl apply -f k8s/rbac.yaml
   ```

### Resource Management

Recommended minimum resources:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

Scale based on workload:
- Light: 256Mi RAM, 250m CPU
- Medium: 512Mi RAM, 500m CPU
- Heavy: 1Gi+ RAM, 1000m+ CPU

### Backup & Recovery

```bash
# Backup configuration
docker cp claudeclaw:/app/config ./config-backup

# Backup results
docker cp claudeclaw:/app/results ./results-backup

# Restore
docker cp ./config-backup claudeclaw:/app/config
```

---

## Monitoring & Logging

### Prometheus Metrics (Future)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'claudeclaw'
    static_configs:
      - targets: ['localhost:3000']
```

### ELK Stack Integration

```yaml
# docker-compose.yml addition
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"

filebeat:
  image: docker.elastic.co/beats/filebeat:8.0.0
  volumes:
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Structured Logging

Logs are output in JSON format:

```json
{
  "level": 30,
  "time": 1683028800000,
  "pid": 12345,
  "hostname": "node1",
  "taskId": "task-1",
  "title": "Test Task",
  "msg": "Task queued"
}
```

Parse with ELK, Datadog, or CloudWatch.

### Health Checks

```bash
# Local health check
curl http://localhost:3000/health

# Kubernetes readiness
kubectl exec claudeclaw-pod -- curl localhost:3000/ready

# Docker health check status
docker inspect --format='{{.State.Health.Status}}' claudeclaw
```

---

## Troubleshooting Deployment

### Container won't start

```bash
# Check logs
docker logs claudeclaw

# Verify API key
docker exec claudeclaw env | grep ANTHROPIC_API_KEY

# Test container
docker run -it claudeclaw node -e "console.log('OK')"
```

### Out of memory

```bash
# Increase memory limit
docker update --memory 1g claudeclaw

# Monitor usage
docker stats claudeclaw
```

### Network issues

```bash
# Test connectivity
docker exec claudeclaw curl https://api.anthropic.com

# DNS resolution
docker exec claudeclaw nslookup api.anthropic.com
```

---

## Production Checklist

- [ ] Secrets stored securely (not in code)
- [ ] Environment variables configured per environment
- [ ] Logging configured (JSON format)
- [ ] Monitoring set up (health checks, metrics)
- [ ] Backups configured
- [ ] Error handling and retries configured
- [ ] Resource limits set
- [ ] Network policies configured
- [ ] HTTPS/TLS enabled where applicable
- [ ] Rate limiting configured
- [ ] Deployment process documented
- [ ] Rollback plan documented

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Heroku Documentation](https://devcenter.heroku.com/)
