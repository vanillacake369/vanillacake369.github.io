---
description: "Proxmox 를 운영하면서 VM 은 언제 쓰고, LXC 는 언제 쓰는지 애매모호하여 정리해보기로 하였다."
date: 2025-12-29
tags: [infra]
lang: ko
draft: false
---

# Why?

Proxmox 를 운영하면서 VM 은 언제 쓰고, LXC 는 언제 쓰는지 애매모호하여 정리해보기로 하였다.

# What?

## **언제 VM 을 쓰고 언제 LXC 를 쓰는지?**

![](/images/notion/b363760d3ae2e6e9.png)

|      | VM                                                     | LXC | Docker |
| ---- | ------------------------------------------------------ | --- | ------ |
| 정의 | Hypervisor 를 통해 Host OS 로부터 아예 OS 레벨로 분리. |

따라서 OS, 커널, 유저스페이스가 아예 분리됨 | Host OS 와 동일한 커널을 사용하되 유저스페이스는 분리
동일 커널을 사용하므로 init process 를 공유함 | Host OS 와 아예 분리되면서 동시에 컨테이너 간 유저스페이스도 분리 |
| 유스케이스 | 아예 커널 레벨, OS 레벨로 분리되어야 하는 경우 | 커널 및 하드웨어 컨트롤을 해야하는 경우 | 커널 및 하드웨어 접근이 없으면서 확장성을 극대화해야할 때
( HostOS 에 직접적인 배포가 아닌 도커 엔진 위에 배포가 되므로 ) |
| 예시 | - 클라우드 호스팅 서비싱을 할 때 (AWS, OCI ,,,)

- 하나의 컴퓨터에서 Windows, Arch Linux, Ubuntu 등등 여러 OS 를 사용해야 하는 경우 | - AI 모델 처리와 같이 직접적인 GPU 컨트롤을 해야하는 경우 | - HostOS 와 상관없이 패키징하여 배포해야할 때
- LXC 보다 더 가벼우므로 확장성을 극대화해야할 때 ( k8s 를 활용한 self healing 이라던지 ) |

```mermaid
flowchart TD
    START([워크로드 분석]) --> Q1{OS/커널/GPU<br/>격리 필요?}

    Q1 -->|Yes| VM[✅ VM]
    Q1 -->|No| Q2{확장성/이식성<br/>CI/CD 중요?}

    Q2 -->|Yes| DOCKER[✅ Docker]
    Q2 -->|No| LXC[✅ LXC]

    VM -.- E1([Windows, GPU ML, 커스텀 커널])
    DOCKER -.- E2([API, Worker, 마이크로서비스])
    LXC -.- E3([DNS, DB, Proxy])
```

## 가상화 솔루션(kubevirt) 대신 아직도 VM 을 쓰는 이유?

6가지 정도의 이유를 나열할 수 있다.

1.

레거시 혹은 커널 의존성 2.

보안 및 격리 3.

안정성 및 영향 범위 4.

다양한 운영 체제 지원 및 유연성 5.

백업, 복원 및 스냅샷 6.

하드웨어 패스스루(Passthrough)

# How?

어떻게 씀?

## 이럴 때 VM 을 써라!

### 유스케이스

1. **멀티 OS 환경** - Windows Server + Linux를 동시에 운영해야 할 때
2. **GPU Passthrough** - AI/ML 워크로드에서 GPU를 직접 할당해야 할 때
3. **커널 커스터마이징** - 특정 커널 버전이나 커널 모듈이 필요할 때
4. **보안 격리** - 금융/의료 등 강력한 격리가 필요한 규제 환경

### 아키텍처 예시

```mermaid
graph TB
    subgraph "Proxmox Host"
        HW[Hardware<br/>CPU, RAM, GPU, NIC]
        HV[Hypervisor - KVM/QEMU]

        subgraph "VM1 - Windows Server"
            W_OS[Windows OS + Kernel]
            W_APP[SQL Server]
        end

        subgraph "VM2 - Ubuntu + GPU"
            U_OS[Ubuntu OS + Kernel]
            U_GPU[GPU Passthrough]
            U_APP[PyTorch ML Training]
        end

        subgraph "VM3 - Custom Kernel"
            C_OS[Arch Linux + Custom Kernel]
            C_APP[Network Appliance]
        end
    end

    HW --> HV
    HV --> W_OS
    HV --> U_OS
    HV --> C_OS
    U_GPU -.->|IOMMU/VT-d| HW

```

### 예시 코드 - Proxmox GPU Passthrough 설정

```bash
# 1. IOMMU 활성화 (GRUB 설정)
# /etc/default/grub
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"

# 2. VFIO 모듈 로드
# /etc/modules
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd

# 3. GPU를 VFIO에 바인딩 (GPU ID 확인 후)
# /etc/modprobe.d/vfio.conf
options vfio-pci ids=10de:2484,10de:228b  # NVIDIA GPU 예시

# 4. Proxmox VM 설정 (qm 명령어)
qm set 100 -hostpci0 0000:01:00.0,pcie=1

```

```bash
# Proxmox CLI로 VM 생성 예시
qm create 100 \
  --name "ml-gpu-vm" \
  --memory 32768 \
  --cores 8 \
  --sockets 1 \
  --cpu host \
  --net0 virtio,bridge=vmbr0 \
  --scsihw virtio-scsi-pci \
  --scsi0 local-lvm:100 \
  --hostpci0 0000:01:00.0,pcie=1 \
  --machine q35 \
  --bios ovmf

```

## 이럴 때 LXC 를 써라!

### 유스케이스

1. **시스템 서비스 운영** - DNS, DHCP, Reverse Proxy 등 인프라 서비스
2. **개발 환경 격리** - 프로젝트별 독립된 환경이 필요하지만 VM까지는 과할 때
3. **경량 서버** - 리소스 오버헤드를 최소화하면서 격리가 필요할 때
4. **Stateful 애플리케이션** - DB, 파일서버 등 영속적 데이터 관리가 필요할 때

### 아키텍처 예시

```mermaid
graph TB
    subgraph "Proxmox Host"
        HW[Hardware]
        K[Linux Kernel - 공유]

        subgraph "LXC 1 - Nginx Proxy"
            U1[Ubuntu Userspace]
            N[Nginx + Certbot]
        end

        subgraph "LXC 2 - Pi-hole DNS"
            D1[Debian Userspace]
            P[Pi-hole]
        end

        subgraph "LXC 3 - PostgreSQL"
            U2[Ubuntu Userspace]
            DB[(PostgreSQL)]
            VOL[`/mnt/data` - Bind Mount]
        end

        subgraph "LXC 4 - Dev Environment"
            A1[Alpine Userspace]
            DEV[Node.js + Python]
        end
    end

    HW --> K
    K --> U1
    K --> D1
    K --> U2
    K --> A1

    Internet((Internet)) --> N
    N --> P
    N --> DB

```

### 예시 코드 - Proxmox LXC 설정

```bash
# LXC 컨테이너 생성 (Proxmox CLI)
pct create 200 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname nginx-proxy \
  --memory 1024 \
  --swap 512 \
  --cores 2 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.10/24,gw=192.168.1.1 \
  --unprivileged 1 \
  --features nesting=1 \
  --onboot 1

# 컨테이너 시작
pct start 200

# 컨테이너 내부 접속
pct enter 200

```

```bash
# LXC 설정 파일 예시 (/etc/pve/lxc/200.conf)
arch: amd64
cores: 2
hostname: nginx-proxy
memory: 1024
mp0: /mnt/host-data,mp=/data          # Bind mount for persistent data
net0: name=eth0,bridge=vmbr0,ip=192.168.1.10/24,gw=192.168.1.1
ostype: ubuntu
rootfs: local-lvm:vm-200-disk-0,size=8G
swap: 512
unprivileged: 1
features: nesting=1                    # Docker-in-LXC 허용

```

```bash
# LXC 내부에서 서비스 설정 예시 (nginx-proxy)
#!/bin/bash
apt update && apt install -y nginx certbot python3-certbot-nginx

# Reverse proxy 설정
cat > /etc/nginx/sites-available/proxy.conf << 'EOF'
upstream backend {
    server 192.168.1.20:3000;  # 다른 LXC의 앱
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/proxy.conf /etc/nginx/sites-enabled/
systemctl reload nginx

```

## 이럴 때 Docker 를 써라!

### 유스케이스

1. **마이크로서비스** - 서비스별 독립 배포 및 스케일링이 필요할 때
2. **CI/CD 파이프라인** - 일관된 빌드/테스트/배포 환경
3. **Stateless 애플리케이션** - 웹 API, Worker 등 수평 확장이 필요할 때
4. **개발-운영 일치** - "내 PC에서는 되는데" 문제 해결

### 아키텍처 예시

```mermaid
graph TB
    subgraph "Proxmox Host"
        subgraph "LXC or VM - Docker Host"
            DE[Docker Engine]

            subgraph "Docker Network"
                subgraph "App Stack"
                    FE[Frontend<br/>React:3000]
                    BE[Backend API<br/>FastAPI:8000]
                    WK[Worker<br/>Celery]
                end

                subgraph "Data Stack"
                    RD[(Redis)]
                    PG[(PostgreSQL)]
                end

                subgraph "Infra Stack"
                    TR[Traefik<br/>Reverse Proxy]
                    PM[Prometheus]
                    GF[Grafana]
                end
            end

            VOL[(Docker Volumes)]
        end
    end

    Internet((Internet)) --> TR
    TR --> FE
    TR --> BE
    BE --> RD
    BE --> PG
    WK --> RD
    PM --> BE
    PM --> WK
    GF --> PM
    PG --> VOL

```

### 예시 코드 - Docker Compose 기반 스택

```yaml
# docker-compose.yml - 마이크로서비스 스택 예시
version: "3.8"

services:
  # Reverse Proxy
  traefik:
    image: traefik:v2.10
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - web

  # Frontend
  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: npm run dev
    labels:
      - "traefik.http.routers.frontend.rule=Host(`app.example.com`)"
    networks:
      - web
    deploy:
      replicas: 2 # 수평 확장

  # Backend API
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/app
      - REDIS_URL=redis://redis:6379
    labels:
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
    depends_on:
      - postgres
      - redis
    networks:
      - web
      - internal
    deploy:
      replicas: 3

  # Background Worker
  worker:
    build: ./backend
    command: celery -A app.worker worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - internal
    deploy:
      replicas: 2

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - internal

  # Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - internal

networks:
  web:
    external: true
  internal:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  traefik-certs:
```

```bash
# Kubernetes 배포 예시 (k3s on Proxmox)
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: api
        image: myregistry/backend:v1.2.3
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

```

[^1]: https://forums.oracle.com/ords/apexds/post/understanding-lxc-and-docker-containers-on-oracle-linux-7995 <https://forums.oracle.com/ords/apexds/post/understanding-lxc-and-docker-containers-on-oracle-linux-7995>

[^2]: https://www.reddit.com/r/Amd/comments/nu22s1/what_is_amd_iommu_and_for_what_i_need_this/ <https://www.reddit.com/r/Amd/comments/nu22s1/what_is_amd_iommu_and_for_what_i_need_this/>

[^3]: https://dzone.com/articles/evolution-of-linux-containers-future <https://dzone.com/articles/evolution-of-linux-containers-future>

[^4]: https://earthly.dev/blog/lxc-vs-docker/ <https://earthly.dev/blog/lxc-vs-docker/>
