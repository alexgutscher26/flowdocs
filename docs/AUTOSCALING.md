# Auto-Scaling Configuration

This document describes the auto-scaling configurations available for FlowDocs across different deployment platforms.

## Overview

Auto-scaling configurations are provided for:

- Vercel (serverless)
- Docker Compose (local/development)
- Kubernetes (K8s)
- AWS ECS Fargate

## Vercel Configuration

**File:** `vercel.json`

Vercel provides automatic serverless scaling. Configuration includes:

- Function memory limits (512MB for API routes, 1GB for app routes)
- Maximum execution duration (30s for API, 60s for app)
- Regional deployment (iad1 - US East)
- Security headers
- Socket.io rewrites

Vercel automatically scales based on incoming requests with no manual configuration needed.

## Docker Compose

**File:** `docker-compose.yml`

For local development and small deployments:

- 2 replicas by default
- Resource limits: 1 CPU, 1GB memory per container
- Resource reservations: 0.5 CPU, 512MB memory
- Automatic restart on failure (max 3 attempts)
- Health checks every 30 seconds
- Includes PostgreSQL and Redis services

**Setup:**
```bash
# Copy environment file
cp .env.docker .env

# Edit .env and update values (especially BETTER_AUTH_SECRET)
nano .env

# Start services with default 2 replicas
docker-compose up -d

# Or scale to specific number of replicas
docker-compose up -d --scale app=3
```

**Environment Variables:**
The docker-compose.yml includes default values for local development:
- `DATABASE_URL`: postgresql://postgres:postgres@postgres:5432/flowdocs
- `POSTGRES_PASSWORD`: postgres (default)
- `BETTER_AUTH_SECRET`: change-me-in-production
- `BETTER_AUTH_URL`: http://localhost:3000
- `NEXT_PUBLIC_APP_URL`: http://localhost:3000

**Important:** Always set a secure `BETTER_AUTH_SECRET` in production:
```bash
openssl rand -hex 32
```

## Kubernetes

**Files:** `k8s/deployment.yaml`, `k8s/hpa.yaml`, `k8s/configmap.yaml`

### Deployment

- Initial replicas: 3
- Resource requests: 500m CPU, 512Mi memory
- Resource limits: 1000m CPU, 1Gi memory
- Liveness, readiness, and startup probes configured
- Session affinity enabled (3-hour timeout)

### Horizontal Pod Autoscaler (HPA)

- Min replicas: 2
- Max replicas: 10
- CPU target: 70% utilization
- Memory target: 80% utilization

**Scale-up behavior:**

- Immediate scaling (0s stabilization)
- Can scale up by 100% or 4 pods per 30 seconds

**Scale-down behavior:**

- 5-minute stabilization window
- Can scale down by 50% or 2 pods per 60 seconds

**Deployment:**

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
```

**Monitoring:**

```bash
kubectl get hpa flowdocs-hpa --watch
kubectl top pods -l app=flowdocs
```

## AWS ECS Fargate

**Files:**

- `aws/ecs-task-definition.json`
- `aws/ecs-service-autoscaling.json`
- `aws/cloudformation-autoscaling.yaml`

### Task Definition

- CPU: 1024 (1 vCPU)
- Memory: 2048 MB
- Health checks every 30 seconds
- CloudWatch Logs integration

### Auto-Scaling Policies

Three target tracking policies:

1. **CPU Utilization**
   - Target: 70%
   - Scale-out cooldown: 60s
   - Scale-in cooldown: 300s

2. **Memory Utilization**
   - Target: 80%
   - Scale-out cooldown: 60s
   - Scale-in cooldown: 300s

3. **ALB Request Count**
   - Target: 1000 requests per target
   - Scale-out cooldown: 60s
   - Scale-in cooldown: 300s

### Capacity

- Min: 2 tasks
- Max: 10 tasks
- Desired: 3 tasks

### Deployment Strategy

- Maximum: 200% (allows full replacement)
- Minimum healthy: 100%
- Circuit breaker enabled with automatic rollback

### CloudFormation Deployment

**Prerequisites:**

1. VPC with public subnets
2. ECR repository with Docker image
3. Secrets in AWS Secrets Manager

**Deploy:**

```bash
aws cloudformation create-stack \
  --stack-name flowdocs-autoscaling \
  --template-body file://aws/cloudformation-autoscaling.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SubnetIds,ParameterValue="subnet-xxxxx,subnet-yyyyy" \
    ParameterKey=ImageUri,ParameterValue=xxxxx.dkr.ecr.region.amazonaws.com/flowdocs:latest \
    ParameterKey=MinCapacity,ParameterValue=2 \
    ParameterKey=MaxCapacity,ParameterValue=10 \
    ParameterKey=DesiredCapacity,ParameterValue=3 \
  --capabilities CAPABILITY_IAM
```

**Monitor:**

```bash
aws ecs describe-services \
  --cluster flowdocs-cluster \
  --services flowdocs-service

aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/flowdocs-cluster/flowdocs-service
```

## Docker Image Build

**File:** `Dockerfile`

Multi-stage build optimized for production:

- Base: Node 20 Alpine
- Stages: deps, builder, runner
- Non-root user (nextjs:nodejs)
- Health check included
- Standalone output for minimal image size
- Prisma schema copied before npm install to support postinstall script

**Build:**

```bash
docker build -t flowdocs:latest .
```

**Run locally:**

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://..." \
  -e NEXT_PUBLIC_APP_URL="https://..." \
  flowdocs:latest
```

**Troubleshooting:**
- If build fails with "Prisma Schema not found", ensure `prisma/schema.prisma` exists
- If npm install fails, check that all dependencies are compatible
- For permission errors, verify the nextjs user has correct permissions

## Health Check Endpoint

All configurations rely on `/api/health` endpoint. Ensure this endpoint exists and returns:

- Status code: 200
- Response time: < 5 seconds

## Monitoring Recommendations

1. **Metrics to track:**
   - Request rate
   - Response time (p50, p95, p99)
   - Error rate
   - CPU utilization
   - Memory utilization
   - Active connections

2. **Alerts to configure:**
   - High error rate (> 1%)
   - High response time (p95 > 1s)
   - Scaling events
   - Health check failures

3. **Tools:**
   - CloudWatch (AWS)
   - Prometheus + Grafana (K8s)
   - Vercel Analytics (Vercel)
   - DataDog, New Relic, or similar APM

## Cost Optimization

1. **Use Fargate Spot** (AWS): 70% cost savings for non-critical workloads
2. **Right-size resources**: Monitor actual usage and adjust limits
3. **Scale-in aggressively**: Longer cooldown prevents thrashing
4. **Use reserved capacity**: For predictable baseline load
5. **Implement caching**: Reduce compute requirements

## Troubleshooting

### Pods/Tasks not scaling up

- Check metrics server is running (K8s)
- Verify resource requests are set
- Check HPA/scaling policy status
- Review CloudWatch/metrics

### Frequent scaling oscillation

- Increase stabilization window
- Adjust target utilization thresholds
- Review scale-in/scale-out cooldowns

### Health checks failing

- Increase startup period
- Check application logs
- Verify health endpoint response time
- Review resource limits

## Next Steps

1. Configure monitoring and alerting
2. Set up CI/CD pipeline for automated deployments
3. Implement blue-green or canary deployments
4. Configure auto-scaling based on custom metrics
5. Set up disaster recovery and backup strategies
