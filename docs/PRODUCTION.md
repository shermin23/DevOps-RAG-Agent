# Production Deployment Checklist

Use this checklist when deploying DevOps RAG Agent to production.

## Security & API Keys

- [ ] Move API key from `.env.local` to **server environment variables** (not in code)
- [ ] Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets)
- [ ] Rotate API keys every 90 days
- [ ] Never commit `.env` files to git
- [ ] Enable CORS restrictions (only allow your domain)
- [ ] Add rate limiting to LLM API calls (prevent abuse)

## Performance & Scaling

- [ ] Add vector database (Pinecone, Weaviate, or Qdrant) for >100 documents
- [ ] Implement caching for frequently asked queries
- [ ] Add CDN (CloudFlare, AWS CloudFront) for static assets
- [ ] Set up database for document persistence (PostgreSQL, MongoDB)
- [ ] Add background job queue (Bull, RabbitMQ) for async LLM calls
- [ ] Monitor API latency (target: <3 seconds)

## Infrastructure & Deployment

- [ ] Deploy to managed container service (Docker, ECS, GKE, AKS)
- [ ] Set up auto-scaling (horizontal pod autoscaler, load balancer)
- [ ] Configure health checks & monitoring (Prometheus, Datadog, New Relic)
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins)
- [ ] Enable HTTPS/TLS (SSL certificate, auto-renewal)
- [ ] Configure backups for document database
- [ ] Set up log aggregation (ELK stack, CloudWatch, Stackdriver)

## Application Features

- [ ] Add user authentication (OAuth2, SAML, JWT)
- [ ] Implement multi-tenancy (separate docs per team/org)
- [ ] Add document version control (track history)
- [ ] Enable audit logging (who uploaded what, when)
- [ ] Add usage analytics (track query success rates)
- [ ] Implement feedback mechanism (thumbs up/down for solutions)

## Testing & Quality

- [ ] Add unit tests (Jest, Vitest)
- [ ] Add integration tests (API + LLM responses)
- [ ] Load test (k6, Apache JMeter, Locust)
- [ ] Security scanning (SAST, dependency checks)
- [ ] E2E testing (Cypress, Playwright)
- [ ] Test failover scenarios (API down, database down)

## Monitoring & Observability

- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Monitor LLM API usage & costs
- [ ] Track retrieval quality (relevance of documents)
- [ ] Monitor response times (P50, P95, P99)
- [ ] Alert on errors (Slack, PagerDuty, email)
- [ ] Dashboard for system health status

## Documentation & Training

- [ ] Write deployment runbook
- [ ] Document API endpoints (Swagger/OpenAPI)
- [ ] Create troubleshooting guide for operators
- [ ] Train support team on system behavior
- [ ] Document disaster recovery procedures
- [ ] Create FAQ for users

## Compliance & Legal

- [ ] Review data privacy laws (GDPR, HIPAA, SOC2)
- [ ] Implement data retention policies
- [ ] Add terms of service & privacy policy
- [ ] Get legal review for LLM usage
- [ ] Ensure document encryption at rest & in transit
- [ ] Document data processing procedures

---

## Phase-Based Rollout

### Phase 1: Alpha (Internal Team)
**Timeline:** Week 1  
**Users:** 5-10 internal DevOps engineers  
**Focus:** Collect feedback, identify bugs  
**Deployment:** Docker Compose on shared server  
**Monitoring:** Basic logs, manual checks

**Checklist:**
- [ ] Staging environment ready
- [ ] Internal documentation written
- [ ] API key configured
- [ ] Database backup procedure tested

### Phase 2: Beta (Extended Team)
**Timeline:** Week 2-4  
**Users:** 20-50 team members  
**Focus:** Scale testing, refine UX  
**Deployment:** Kubernetes or managed cloud service  
**Monitoring:** Prometheus, basic alerting

**Checklist:**
- [ ] Production environment ready
- [ ] Load balancer configured
- [ ] Health checks implemented
- [ ] Rollback procedure documented
- [ ] Incident response plan ready

### Phase 3: Production (Full Rollout)
**Timeline:** Week 5+  
**Users:** Entire organization  
**Focus:** Stability, cost optimization  
**Deployment:** HA setup (2+ replicas)  
**Monitoring:** Full stack (logs, metrics, traces)

**Checklist:**
- [ ] All security measures in place
- [ ] Redundancy configured
- [ ] Disaster recovery tested
- [ ] Cost monitoring active
- [ ] SLA defined & communicated

---

## Docker Deployment Example

### Build & Test Locally
```bash
# Build image
docker build -t devops-rag-agent:v1.0 .

# Run container
docker run -e VITE_API_KEY=sk-xxx -p 3000:3000 devops-rag-agent:v1.0

# Test
curl http://localhost:3000
```

### Push to Registry
```bash
# Tag image
docker tag devops-rag-agent:v1.0 your-registry.azurecr.io/devops-rag-agent:v1.0

# Push
docker push your-registry.azurecr.io/devops-rag-agent:v1.0
```

### Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-agent
  namespace: default
spec:
  replicas: 3  # High availability
  selector:
    matchLabels:
      app: rag-agent
  template:
    metadata:
      labels:
        app: rag-agent
    spec:
      containers:
      - name: rag-agent
        image: your-registry.azurecr.io/devops-rag-agent:v1.0
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_KEY
          valueFrom:
            secretKeyRef:
              name: rag-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: rag-agent-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: rag-agent
```

Deploy:
```bash
# Create secret
kubectl create secret generic rag-secrets \
  --from-literal=api-key=sk-xxxx

# Deploy
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl get svc
```

---

## Cost Estimation

### Development ($0-5/month)
- Gemini API: Free tier (60 requests/minute)
- Hosting: Free tier (Vercel, GitHub Pages)
- Total: **$0**

### Production (10 DevOps Engineers)
- Gemini API: ~100 queries/day × $0.00075/query = **$75/month**
- Hosting (cloud): EC2 + load balancer = **$200-500/month**
- Database (optional): RDS, MongoDB = **$50-200/month**
- Monitoring: Datadog, CloudWatch = **$100-300/month**
- **Total: ~$500-1200/month**

### At Scale (1000+ Engineers)
- Gemini API: ~10K queries/day = **$7,500/month**
- Hosting: Kubernetes cluster = **$2000-5000/month**
- Database: Managed vector DB (Pinecone) = **$1000-3000/month**
- Monitoring & compliance = **$2000+/month**
- **Total: ~$12K-15K+/month**

---

## Rollback Procedure

If issues occur in production:

```bash
# 1. Identify the issue
kubectl describe pod <pod-name>

# 2. Roll back to previous version
kubectl rollout undo deployment/rag-agent

# 3. Verify rollback
kubectl get pods
kubectl logs <pod-name>

# 4. Notify team
# Alert PagerDuty, Slack, etc.
```

---

## Support & Escalation

**Level 1 (App Issues)**
- Check logs: `kubectl logs -f <pod>`
- Restart pod: `kubectl rollout restart deployment/rag-agent`
- Update image: `kubectl set image deployment/rag-agent rag-agent=new-image:tag`

**Level 2 (Infrastructure Issues)**
- Check node health: `kubectl get nodes`
- Check resource usage: `kubectl top nodes`
- Scale cluster: `kubectl scale statefulset <name> --replicas=5`

**Level 3 (Emergency)**
- Contact cloud provider support
- Activate disaster recovery plan
- Notify stakeholders of ETA

---

## Success Criteria

You'll know the deployment is successful when:

✅ Uptime: >99.5% SLA  
✅ Response time: <3 seconds p95  
✅ Error rate: <0.1%  
✅ User adoption: >80% of team  
✅ Cost per query: <$0.01  
✅ Zero security incidents  
✅ Full documentation available  
