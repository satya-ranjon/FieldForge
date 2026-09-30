# FieldForge — Linux VPS Production & Staging Deployment Guide

> **Enterprise Field Service Marketplace & Microservices Platform**  
> Complete step-by-step deployment guide for standalone Linux Virtual Private Servers (VPS) — including DigitalOcean Droplets, Hetzner Cloud, Linode/Akamai, AWS Lightsail, Vultr, and bare-metal servers — using Docker Compose, Caddy / Nginx reverse proxy, and automated SSL/TLS.

---

## 1. Architecture Overview

For teams seeking a self-hosted, cost-effective staging, demo, or production deployment without the cost and operational complexity of managed cloud Kubernetes (EKS/GKE), FieldForge can be deployed on a single hardened Linux VPS host using containerized microservices and automated reverse proxy routing.

### Visual Deployment & Server Architecture Flow

![FieldForge VPS Deployment Architecture](images/vps_deployment_flow.jpg)

```mermaid
graph TD
    subgraph Internet_Traffic ["Public Internet (DNS: fieldforge.yourdomain.com)"]
        User["🌐 Buyer Browser / Mobile App"] -->|HTTPS / Port 443| UFW["🛡️ UFW Firewall<br/>(Only Ports 22, 80, 443 open)"]
    end

    subgraph VPS_Host ["Hardened Linux VPS Host (Ubuntu 24.04 LTS / Debian 12)"]
        UFW --> Caddy["🔒 Caddy Reverse Proxy<br/>Auto Let's Encrypt TLS · Security Headers"]

        subgraph Docker_Bridge ["Docker Internal Network (fieldforge-internal)"]
            Caddy -->|/api/*| APIGW["⚡ API Gateway (:8000)<br/>Edge Proxy · Rate Limiting · Correlation ID"]
            Caddy -->|/*| BuyerPortal["🏢 Web Buyer Portal (:5173)<br/>Next.js 16 App Router · React 19"]

            APIGW --> AuthSvc["🔐 Auth Service (:8001)"]
            APIGW --> WOSvc["📋 Work Order Service (:8002)"]
            APIGW --> DispSvc["📍 Dispatch Matching (:8003)"]
            APIGW --> BillSvc["💳 Billing Service (:8004)"]

            WOSvc -->|Publish Events| RabbitMQ["🐰 RabbitMQ 4.1<br/>Topic Exchanges · Dead Letter Exchange"]
            RabbitMQ -->|Consume| DispSvc
            RabbitMQ -->|Consume| BillSvc
            RabbitMQ -->|Consume| NotifSvc["🔔 Notification Service (:8005)"]

            AuthSvc --> MySQL[("🐬 MySQL 8.4 InnoDB<br/>Users · Profiles · Schema")]
            WOSvc --> MySQL
            BillSvc --> MySQL
            DispSvc --> Redis[("⚡ Redis 8.0<br/>Geospatial GEOSEARCH · Idempotency")]
            WOSvc -->|Presigned Uploads| MinIO[("🪣 MinIO / Local S3<br/>Deliverables Storage")]
        end

        subgraph Host_Storage ["Persistent Host Volumes (/var/lib/fieldforge)"]
            MySQL --> Vol_DB["/var/lib/fieldforge/mysql"]
            Redis --> Vol_Cache["/var/lib/fieldforge/redis"]
            RabbitMQ --> Vol_MQ["/var/lib/fieldforge/rabbitmq"]
            MinIO --> Vol_S3["/var/lib/fieldforge/minio"]
        end

        subgraph System_Daemons ["Host Daemons & Maintenance"]
            Systemd["⚙️ systemd (fieldforge.service)"] --> Docker_Bridge
            Cron["⏰ Cron Nightly Backups"] --> BackupDir["/var/backups/fieldforge/"]
        end
    end
```

---

## 2. Server Sizing & Minimum Requirements

| Tier                         | Workload / Traffic                        | Recommended VPS Specifications                                                  | Example Providers & Plans                           |
| :--------------------------- | :---------------------------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------------- |
| **Minimum (Staging / Demo)** | Development, Staging, Internal Testing    | 4 vCPU, 8 GB RAM, 80 GB SSD / NVMe                                              | Hetzner CPX31, DigitalOcean 8GB Droplet, Linode 8GB |
| **Recommended (Production)** | Live Marketplace, 50-200 concurrent users | 8 vCPU, 16 GB RAM, 160 GB NVMe                                                  | Hetzner CPX41, DigitalOcean 16GB CPU-Optimized      |
| **High Availability**        | Enterprise multi-region or >500 users     | See [AWS Deployment Guide](DEPLOYMENT_AWS.md) or [GCP Guide](DEPLOYMENT_GCP.md) | EKS / GKE multi-AZ clusters                         |

**Operating System**: Ubuntu 24.04 LTS (recommended) or Debian 12 x86_64 / arm64.

---

## 3. Step-by-Step Deployment Flow

### Step 1: VPS Provisioning & OS Security Hardening

Connect to your freshly provisioned server via SSH as root:

```bash
ssh root@<YOUR_VPS_IP>
```

#### 1.1 Update System & Install Base Packages

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban unattended-upgrades htop jq
```

#### 1.2 Create Dedicated Non-Root Deployer User

```bash
adduser --gecos "" deployer
usermod -aG sudo deployer

# Copy SSH authorized keys from root
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
```

#### 1.3 Harden SSH Configuration

Edit `/etc/ssh/sshd_config.d/hardening.conf` (or `/etc/ssh/sshd_config`):

```ini
PermitRootLogin no
PasswordAuthentication no
X11Forwarding no
MaxAuthTries 3
```

Restart SSH daemon:

```bash
systemctl restart sshd
```

#### 1.4 Configure UFW Firewall

Allow only SSH, HTTP, and HTTPS:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### 1.5 Configure Swap Space (Prevents OOM during heavy operations)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

### Step 2: Install Docker Engine & Docker Compose

Install the latest official Docker Engine and Docker Compose v2:

```bash
# 1. Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# 2. Add repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker packages
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Add deployer to docker group
usermod -aG docker deployer
systemctl enable docker
```

Switch to the `deployer` user for all subsequent operations:

```bash
su - deployer
```

---

### Step 3: Directory Structure & Host Volume Setup

Create the persistent storage and configuration layout on the host:

```bash
sudo mkdir -p /var/lib/fieldforge/mysql
sudo mkdir -p /var/lib/fieldforge/redis
sudo mkdir -p /var/lib/fieldforge/rabbitmq
sudo mkdir -p /var/lib/fieldforge/minio
sudo mkdir -p /var/backups/fieldforge
sudo mkdir -p /opt/fieldforge/caddy

# Set ownership
sudo chown -R 999:999 /var/lib/fieldforge/mysql
sudo chown -R 999:999 /var/lib/fieldforge/redis
sudo chown -R 999:999 /var/lib/fieldforge/rabbitmq
sudo chown -R deployer:deployer /opt/fieldforge
```

---

### Step 4: Clone Repository & Configure Production Environment

1. Clone FieldForge into `/opt/fieldforge`:

   ```bash
   cd /opt/fieldforge
   git clone https://github.com/satya-ranjon/FieldForge.git app
   cd app
   ```

2. Author `/opt/fieldforge/app/.env.production` (never commit this file):
   ```bash
   # =========================================================================
   # FieldForge Production Environment Configuration (VPS)
   # =========================================================================
   NODE_ENV=production
   DOMAIN=fieldforge.yourdomain.com

   # Security & Authentication
   JWT_SECRET=super_secret_production_key_minimum_32_characters_random_hex
   INTERNAL_SERVICE_SECRET=internal_service_mesh_secret_token_128bit
   CORS_ORIGIN=https://fieldforge.yourdomain.com

   # Backing Infrastructure Credentials
   MYSQL_ROOT_PASSWORD=generate_strong_root_password
   MYSQL_DATABASE=fieldforge
   MYSQL_USER=fieldforge
   MYSQL_PASSWORD=generate_strong_app_password
   DATABASE_URL=mysql://fieldforge:generate_strong_app_password@mysql:3306/fieldforge

   REDIS_URL=redis://redis:6379

   RABBITMQ_DEFAULT_USER=fieldforge
   RABBITMQ_DEFAULT_PASS=generate_strong_rabbitmq_password
   RABBITMQ_URL=amqp://fieldforge:generate_strong_rabbitmq_password@rabbitmq:5672

   # S3 / MinIO Object Storage for Deliverables (Photos, Signatures)
   S3_ENDPOINT=http://minio:9000
   S3_PUBLIC_URL=https://fieldforge.yourdomain.com/storage
   S3_BUCKET=fieldforge-deliverables
   S3_ACCESS_KEY=minio_admin_user
   S3_SECRET_KEY=generate_strong_minio_secret_key
   S3_REGION=us-east-1
   ```

---

### Step 5: Production Docker Compose Manifest

Create `/opt/fieldforge/app/docker-compose.prod.yml`:

```yaml
version: '3.8'

networks:
  fieldforge-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/fieldforge/mysql
  redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/fieldforge/redis
  rabbitmq_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/fieldforge/rabbitmq
  minio_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/fieldforge/minio

services:
  # ---------------------------------------------------------------------------
  # Backing Services
  # ---------------------------------------------------------------------------
  mysql:
    image: mysql:8.4
    container_name: fieldforge-mysql
    restart: unless-stopped
    command:
      [
        '--default-authentication-plugin=caching_sha2_password',
        '--character-set-server=utf8mb4',
        '--collation-server=utf8mb4_unicode_ci',
        '--max-connections=200'
      ]
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - fieldforge-network
    healthcheck:
      test:
        ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-u', 'root', '-p${MYSQL_ROOT_PASSWORD}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8.0-alpine
    container_name: fieldforge-redis
    restart: unless-stopped
    command:
      [
        'redis-server',
        '--appendonly',
        'yes',
        '--maxmemory',
        '512mb',
        '--maxmemory-policy',
        'noeviction'
      ]
    volumes:
      - redis_data:/data
    networks:
      - fieldforge-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:4.1-management-alpine
    container_name: fieldforge-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - fieldforge-network
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', 'check_running']
      interval: 15s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-11-07T00-52-20Z
    container_name: fieldforge-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    volumes:
      - minio_data:/data
    networks:
      - fieldforge-network

  # ---------------------------------------------------------------------------
  # Application Microservices
  # ---------------------------------------------------------------------------
  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
    container_name: fieldforge-api-gateway
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8000
      AUTH_SERVICE_URL: http://auth-service:8001
      WORK_ORDER_SERVICE_URL: http://work-order-service:8002
      DISPATCH_SERVICE_URL: http://dispatch-matching-service:8003
      BILLING_SERVICE_URL: http://billing-service:8004
      NOTIFICATION_SERVICE_URL: http://notification-service:8005
    networks:
      - fieldforge-network
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

  auth-service:
    build:
      context: .
      dockerfile: apps/auth-service/Dockerfile
    container_name: fieldforge-auth-service
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8001
    networks:
      - fieldforge-network
    depends_on:
      mysql:
        condition: service_healthy

  work-order-service:
    build:
      context: .
      dockerfile: apps/work-order-service/Dockerfile
    container_name: fieldforge-work-order-service
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8002
    networks:
      - fieldforge-network
    depends_on:
      mysql:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  dispatch-matching-service:
    build:
      context: .
      dockerfile: apps/dispatch-matching-service/Dockerfile
    container_name: fieldforge-dispatch-matching-service
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8003
    networks:
      - fieldforge-network
    depends_on:
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  billing-service:
    build:
      context: .
      dockerfile: apps/billing-service/Dockerfile
    container_name: fieldforge-billing-service
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8004
    networks:
      - fieldforge-network
    depends_on:
      mysql:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  notification-service:
    build:
      context: .
      dockerfile: apps/notification-service/Dockerfile
    container_name: fieldforge-notification-service
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 8005
    networks:
      - fieldforge-network
    depends_on:
      rabbitmq:
        condition: service_healthy

  web-buyer-portal:
    build:
      context: .
      dockerfile: apps/web-buyer-portal/Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://${DOMAIN}/api
    container_name: fieldforge-web-buyer-portal
    restart: unless-stopped
    env_file: .env.production
    environment:
      PORT: 5173
    networks:
      - fieldforge-network
    depends_on:
      - api-gateway

  # ---------------------------------------------------------------------------
  # Edge Reverse Proxy (Automatic TLS via Let's Encrypt)
  # ---------------------------------------------------------------------------
  caddy:
    image: caddy:2.8-alpine
    container_name: fieldforge-caddy
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - /opt/fieldforge/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - /opt/fieldforge/caddy/data:/data
      - /opt/fieldforge/caddy/config:/config
    networks:
      - fieldforge-network
    depends_on:
      - api-gateway
      - web-buyer-portal
```

---

### Step 6: Edge Reverse Proxy Configuration (Caddy)

Caddy automatically provisions, validates, and renews Let's Encrypt TLS certificates with zero configuration.

Create `/opt/fieldforge/caddy/Caddyfile`:

```caddyfile
fieldforge.yourdomain.com {
    encode gzip zstd

    # Security Headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # API Gateway routing
    handle /api/* {
        reverse_proxy api-gateway:8000
    }

    # Local S3/MinIO deliverables storage
    handle /storage/* {
        uri strip_prefix /storage
        reverse_proxy minio:9000
    }

    # Next.js Web Buyer Portal (SPA / SSR)
    handle {
        reverse_proxy web-buyer-portal:5173
    }
}
```

---

### Step 7: Database Migration Execution

Before running the full suite, execute Drizzle migrations against the MySQL database container:

1. Start backing services first:

   ```bash
   docker compose -f docker-compose.prod.yml up -d mysql redis rabbitmq minio
   ```

2. Wait for MySQL healthy status:

   ```bash
   docker compose -f docker-compose.prod.yml exec mysql mysqladmin ping -h localhost -u root -p
   ```

3. Run migrations via the migration container or database package:

   ```bash
   docker compose -f docker-compose.prod.yml run --rm \
     --entrypoint "pnpm --filter @fieldforge/database db:migrate" \
     auth-service
   ```

4. Verify created tables:
   ```bash
   docker compose -f docker-compose.prod.yml exec mysql mysql -u fieldforge -p fieldforge -e "SHOW TABLES;"
   ```

---

### Step 8: Start Microservices & Verify Deployment

1. Build and start all services in the background:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

2. Monitor container status:

   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

3. View live unified logs:

   ```bash
   docker compose -f docker-compose.prod.yml logs -f --tail=50
   ```

4. Verify health endpoints directly from the host:
   ```bash
   curl -f http://localhost:8000/healthz
   curl -f http://localhost:8000/readyz
   curl -I https://fieldforge.yourdomain.com
   ```

---

### Step 9: Systemd Auto-Restart on VPS Boot

Ensure Docker Compose automatically starts FieldForge whenever the VPS host reboots.

Create `/etc/systemd/system/fieldforge.service`:

```ini
[Unit]
Description=FieldForge Enterprise Microservices Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/fieldforge/app
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable fieldforge.service
```

---

### Step 10: Automated Database Backups (Cron Runbook)

Create `/opt/fieldforge/scripts/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/fieldforge"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/fieldforge_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Dump and compress database
docker compose -f /opt/fieldforge/app/docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --single-transaction --quick fieldforge | \
  gzip > "${FILENAME}"

# Retain only last 7 daily backups
find "${BACKUP_DIR}" -type f -name "fieldforge_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed successfully: ${FILENAME}"
```

Make executable and add to crontab:

```bash
chmod +x /opt/fieldforge/scripts/backup-db.sh

# Schedule nightly at 02:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/fieldforge/scripts/backup-db.sh >> /var/log/fieldforge-backup.log 2>&1") | crontab -
```

---

### Step 11: Alternative VPS Deployment: Lightweight Kubernetes (K3s)

If you prefer using FieldForge's declarative Kubernetes manifests (`infra/k8s/`) on a single VPS instead of Docker Compose:

1. **Install K3s**:

   ```bash
   curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
   export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
   ```

2. **Deploy StorageClass & Ingress-NGINX**:
   K3s provides `local-path` as the default StorageClass for persistent volumes out-of-the-box.

   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/baremetal/deploy.yaml
   ```

3. **Deploy FieldForge Manifests**:
   Deploy directly using the repository's Kustomize suite:
   ```bash
   kubectl apply -f infra/k8s/base/
   kubectl apply -f infra/k8s/backing/
   kubectl apply -k infra/k8s/migrations/
   kubectl apply -k infra/k8s/
   ```

---

## 4. Emergency Troubleshooting & Operational Runbook

### Checking Container Health & Resource Usage

```bash
docker stats
```

### Inspecting Error Logs

```bash
docker compose -f docker-compose.prod.yml logs -f api-gateway
docker compose -f docker-compose.prod.yml logs -f work-order-service
```

### Zero-Downtime Rolling Update via SSH

```bash
cd /opt/fieldforge/app
git pull origin develop
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway web-buyer-portal
```
