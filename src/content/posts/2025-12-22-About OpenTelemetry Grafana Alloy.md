---
description: "관찰 대상이 많아질수록 수집 파이프라인이 흩어진다. OpenTelemetry Collector와 Grafana Alloy로 이를 하나로 모으는 방법을 정리한다."
tags: [journal]
lang: ko
draft: false
---

# Why?

사내 크롤링 프로젝트에 대한 성능테스트 보고서 도출이 필요했고, 이에 따라 observability 에 대한 가이드라인을 먼저 설계해야 했다.

![](/images/velog/1d68a0cebcc482cf.png)

보다시피 관찰해야 할 대상이 한두 개가 아니었다. 관리자 백엔드 서버, 크롤링 백엔드 서버, 람다와 SQS, RDS 등 각 컴포넌트의 metric · log · trace뿐 아니라 인스턴스 상태 체크와 컨테이너 상태 체크까지 확인해야 성능테스트 보고서를 작성할 수 있다.

따라서 이 모든 데이터를 한 곳으로 모아 줄 collector 가 필요했고, 흔히 쓰이는 OpenTelemetry 를 구성하기로 결정했다. 예시 구현에 앞서 개념 학습 차원에서 (1) 어떤 컴포넌트들이 있고 (2) 각각 어떤 역할을 하며 (3) 어떻게 구성하는지를 학습했다.

# OpenTelemetry 🔭

## 전체 처리 과정 🔄

OpenTelemetry 의 처리 흐름을 순서도로 정리하면 아래와 같다.

![](/images/velog/6269802e2e9ef425.png)

1. **앱에서 SDK 호출** — 언어별 OTel SDK 가 트레이스/메트릭/로그를 생성하고, OTLP Exporter 로 내보내도록 환경변수 또는 코드로 설정한다.[^1]

2. **OTLP 로 전송** — gRPC(4317) 또는 HTTP(4318) 로 Collector 의 OTLP endpoint 에 전달한다.[^2]

3. **Receiver 수신** — Collector 의 OTLP Receiver 가 수신한다. 공개 도메인은 Gateway 를 외부에 노출할 때만 필요하고, 보통은 동일 호스트/내부 네트워크/VPC 로 통신한다. 공식 문서상 권장 배치 구조는 **Agent(로컬) → Gateway(중앙)** 이다.[^3]

4. **Processor 처리** — N 개의 파이프라인을 통해 필요한 전처리를 수행한다. 필터 역할뿐 아니라 backpressure(`batch`, `memory_limiter`), 라벨링(`attributes`, `resource`), 라우팅(`routing`) 등을 담당한다.[^4]

5. **Exporter 전송** — 백엔드별 Exporter 로 Tempo/Jaeger/Prometheus/Loki 등으로 내보내고 Grafana 에서 시각화한다.[^5]

## Collector 란 📦

![](/images/velog/5d472e48a50efaef.png)

Collector 는 사실상 OpenTelemetry 의 핵심이다.

> **Why "collector" over "direct backend call" ?**
>
> 각 옵저버 툴 OSS 를 직접 호출해 데이터를 저장하는 방법도 있다. 하지만 이는 강결합을 일으켜 다음과 같은 단점이 생긴다.
>
> - 옵저버 툴이 늘어날수록 코드 수정이 늘어남
> - 각 옵저버 툴에 대한 부가적인 처리 패턴이 단편화됨
> - 언어별 구현체가 제한됨
>
> 결론적으로 Collector 는 강결합을 끊어 주고 옵저버 데이터 처리 과정을 하나로 응집시켜 주는 딱풀 같은 역할을 한다. 이것이 바로 OpenTelemetry 의 존재 의의다.[^6]

## 수집 데이터를 Collector 로 보내는 배치 패턴 🗺️

수집한 데이터를 Collector 로 보내는 패턴은 공식 문서 기준으로 세 가지다.[^3] Collector 의 하위 컴포넌트인 Receiver 가 이를 처리하며, Receiver 에 대해서는 실습 섹션에서 자세히 다룬다.

- **직접 전송**: 백엔드 툴에 직접 전송한다.
  ![](/images/velog/7cbf7762a5ab42cb.png)
- **에이전트 방식**: 애플리케이션에 OTLP 담당 에이전트를 심어 전송한다. 대부분의 데모가 이 방식을 사용한다.
  ![](/images/velog/8393530cad8c58ed.png)
- **게이트웨이 방식**: k8s 처럼 OpenTelemetry 를 클러스터링했을 때 적합한 방식이다.
  ![](/images/velog/33047be93e8af802.png)

실습은 가장 일반적인 에이전트 방식(2번안)으로 진행한다.

## OpenTelemetry 실습 🛠️

> **docker compose 에서 `network_mode: host` 를 쓰면 안 되는 이유**
>
> Docker 내부 브리지 네트워크(`bridge` 혹은 `default`)를 사용할 때 `network_mode: host` 를 지정하면 컨테이너가 호스트(OS) 의 네트워크 스택을 그대로 공유하므로 다른 컨테이너와 통신할 수 없다. 따라서 모니터링 컨테이너들은 동일한 네트워크 선상에 두는 것이 중요하다.
>
> ```yaml
> # ❌ 이렇게 하면 같은 compose 내 컨테이너와 통신 불가
> services:
>   node-exporter:
>     image: prom/node-exporter
>     network_mode: host
> ```

### 1) 컨테이너 구성

각 exporter 와 서비스, 그리고 OpenTelemetry 구성을 위해 아래와 같이 `docker-compose.yml` 을 작성한다.

```yaml
services:
  # 간단 웹 서버 컨테이너
  hello-world:
    image: crccheck/hello-world
    ports:
      - 8000:8000

  # Node Exporter
  # 시스템(Host) 메트릭 수집: CPU, 메모리, 디스크, 네트워크 등
  # Prometheus 형식으로 메트릭 노출 (HTTP :9100/metrics)
  node_exporter:
    image: quay.io/prometheus/node-exporter:latest
    container_name: node_exporter
    command:
      # 호스트 파일시스템 루트 경로 지정
      # /host 경로를 시스템 루트로 인식하여 메트릭 수집
      - "--path.rootfs=/host"
    # network_mode: host 제거 - Docker 네트워크 사용으로 다른 컨테이너와 통신 가능
    ports:
      - 9100:9100
    # 호스트의 프로세스 네임스페이스 공유
    # 호스트의 모든 프로세스 정보 접근 가능
    pid: host
    restart: unless-stopped
    volumes:
      # 호스트 루트 파일시스템 (읽기 전용)
      # 시스템 메트릭 수집을 위한 전체 파일시스템 접근
      # /proc, /sys 등 시스템 정보 디렉토리 포함
      # WSL2 환경에서는 rslave 옵션 제거 (마운트 전파 불필요)
      - "/:/host:ro"

  # 오픈텔레메트리
  open-collector:
    image: otel/opentelemetry-collector-contrib
    volumes:
      - ./otel/otel-collector-config.yaml:/etc/otelcol-contrib/config.yaml
    ports:
      - 1888:1888 # pprof extension
      - 8888:8888 # Prometheus metrics exposed by the Collector
      - 8889:8889 # Prometheus exporter metrics
      - 13133:13133 # health_check extension
      - 4317:4317 # OTLP gRPC receiver
      - 4318:4318 # OTLP http receiver
      - 55679:55679 # zpages extension

  # 프로메테우스
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - --web.enable-remote-write-receiver
      - --enable-feature=native-histograms
      - --config.file=/etc/prometheus/prometheus.yml
    depends_on:
      - open-collector

  # 그라파나
  grafana:
    image: grafana/grafana
    ports:
      - 13000:3000
    volumes:
      - ./grafana-provisioning:/etc/grafana/provisioning
      - ./grafana-dashboard:/dashboard
    depends_on:
      - prometheus

  # k6 — 부하 테스트 도구, 테스트 완료 후 컨테이너 자동 종료 (일회성 실행)
  k6:
    image: grafana/k6
    volumes:
      - ./k6-scripts:/scripts
    command: run -o experimental-prometheus-rw /scripts/load-test.js
    environment:
      # k6 메트릭을 Prometheus Remote Write 엔드포인트로 실시간 전송
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      # Trend 메트릭을 Native Histogram 으로 전송해 더 정확한 p95, p99 계산
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
    # 컨테이너 내부에서 host.docker.internal 로 호스트 localhost 접근
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - prometheus
      - hello-world

  # CAdvisor
  # 컨테이너 메트릭 수집: CPU, 메모리, 네트워크, 디스크 사용량
  # Prometheus 형식으로 메트릭 노출 (HTTP :8080/metrics)
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
      - 8080:8080
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
```

### 2) OpenTelemetry 설정

각 exporter 혹은 Prometheus, Loki, Tempo 등에 대해 OTel Collector 설정을 아래와 같이 선언한다. `service.pipelines` 에 등록되지 않은 컴포넌트는 활성화되지 않으므로 반드시 등록해야 한다.

```yaml
# ====== receivers 선언부 ======
# https://opentelemetry.io/docs/collector/configuration/#receivers
receivers:
  # 웹 서버 컨테이너로부터 metric, log, trace 전송받음 (OTLP 프로토콜)
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  # Node Exporter / CAdvisor 로부터 Prometheus 스크랩 방식으로 수집
  prometheus:
    config:
      scrape_configs:
        - job_name: "node-exporter"
          scrape_interval: 15s
          static_configs:
            - targets: ["node_exporter:9100"]
        # metric_relabel_configs 으로 hello-world 컨테이너만 필터링
        - job_name: "cadvisor"
          scrape_interval: 15s
          static_configs:
            - targets: ["cadvisor:8080"]
          metric_relabel_configs:
            - source_labels: [name]
              regex: "hello-world"
              action: keep

# ====== processors 선언부 ======
# https://opentelemetry.io/docs/collector/configuration/#processors
processors:
  # 트레이스에 환경 라벨 삽입, 민감 정보 삭제/해싱
  attributes:
    actions:
      - key: environment
        value: production
        action: insert
      - key: db.statement
        action: delete
      - key: email
        action: hash

# ====== exporters 선언부 ======
# https://opentelemetry.io/docs/collector/configuration/#exporters
exporters:
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    tls:
      insecure: true

# ====== extensions 선언부 ======
# Collector 자체에 대한 상태 체크, 프로파일링 등
# https://opentelemetry.io/docs/collector/configuration/#extensions
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
  pprof:
    endpoint: 0.0.0.0:1777
  zpages:
    endpoint: 0.0.0.0:55679

# ====== service 선언부 ======
# 여기에 등록되지 않은 컴포넌트는 활성화되지 않음
service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [prometheusremotewrite]
    # traces/logs 는 필요 시 아래 주석 해제
    # traces:
    #   receivers: [otlp]
    #   processors: [attributes]
    #   exporters: [prometheusremotewrite]
    # logs:
    #   receivers: [otlp]
    #   exporters: [prometheusremotewrite]
```

OTel Collector 단독 구성은 node_exporter, cAdvisor 등을 별도 컨테이너로 관리해야 하는 부담이 있다. 이 한계를 해결한 것이 다음에 소개할 Grafana Alloy 다.

# Grafana Alloy ☀️

## Alloy 란? 🌐

Alloy 는 Grafana Labs 가 제공하는 오픈소스 텔레메트리 수집기(collector)다.[^7] 공식 슬로건은 "Collect all your telemetry with one product" 로, metrics · logs · traces · profiling 을 단일 제품으로 수집·처리·전송할 수 있다. Prometheus pipeline 과 OpenTelemetry receiver 가 네이티브로 통합되어 있어 기존 Prometheus + OTel 구성에서 사용하던 많은 기술을 흡수하고 있다. 인프라 감시와 애플리케이션 감시 양쪽에 적합하도록 설계되었으며, 클러스터링·DaemonSet 기반 배포·확장성 등 엔터프라이즈 요구사항도 고려되어 있다.

즉, OTel Collector 단독 구성과 달리 **인프라 감시를 위한 exporter/scraper 까지 내장된 통합형** 으로 볼 수 있다.

## OTel Collector 대비 장점은? ⚡

| 항목 | OTel Collector 또는 Prometheus+Exporter 방식 | Alloy 방식의 장점 |
| --- | --- | --- |
| 구성 복잡성 | node_exporter, cAdvisor, mysqld_exporter 등 설치·관리 필요 | 내장 컴포넌트로 대부분 단순화 가능 |
| 메트릭 종류 | 인프라/컨테이너/DB 메트릭 별도 구성 필요 | 인프라·컨테이너·DB 메트릭까지 내장 컴포넌트로 지원 |
| 운영 일관성 | 메트릭별 도구가 달라 라벨·스크레이프 방식 통일 어려움 | 하나의 수집기로 통합되어 라벨/동작 일관성 확보 |
| 확장성/배포 유형 | 도구별 배포 전략이 다를 수 있음 | 호스트 데몬·DaemonSet·StatefulSet 등 다양하게 지원[^8] |
| 유지보수 비용 | 여러 도구 각각 업그레이드·설정 필요 | Alloy 하나로 설정·업그레이드 범위 축소 |
| 커스터마이징 | exporter 별 설정, Prometheus remote write 구성 필요 | 설정 파일 하나에서 다양한 컴포넌트 관리 가능(예: `prometheus.exporter.mysql`)[^9] |

## Grafana Alloy 실습 🛠️

### 1) 컨테이너 구성

Alloy 는 내장 컴포넌트가 많아 node_exporter, cAdvisor 등 별도 컨테이너 없이 `alloy` 하나로 처리된다는 점이 OTel Collector 구성과의 핵심 차이다.

```yaml
services:
  # 간단 웹 서버 컨테이너
  hello-world:
    image: crccheck/hello-world
    container_name: hello-world
    labels:
      app: "hello-world"
      service: "hello-world"
    ports:
      - 8000:8000

  # Alloy — OTel Collector 대체 + 내장 Node Exporter/cAdvisor 사용
  alloy:
    image: grafana/alloy:latest
    container_name: alloy
    labels:
      app: "alloy"
      service: "alloy"
    volumes:
      - ./alloy/config.alloy:/etc/alloy/config.alloy:ro
      # cAdvisor 기능을 위한 Docker 소켓 접근
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # Node Exporter 기능을 위한 호스트 파일시스템 접근
      - /:/host:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /var/run:/var/run:ro
      - /var/lib/docker/:/var/lib/docker:ro
    command:
      - run
      - --stability.level=experimental
      - /etc/alloy/config.alloy
    ports:
      - 4317:4317 # OTLP gRPC receiver
      - 4318:4318 # OTLP http receiver
      - 12345:12345 # Alloy HTTP server (health check, metrics)
    pid: host
    privileged: true
    environment:
      - HOST_PROC=/host/proc
      - HOST_SYS=/host/sys
      - HOST_ROOT=/host

  # 프로메테우스
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    labels:
      app: "prometheus"
      service: "prometheus"
    ports:
      - 9090:9090
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - --web.enable-remote-write-receiver
      - --enable-feature=native-histograms
      - --config.file=/etc/prometheus/prometheus.yml
    depends_on:
      - hello-world

  # 그라파나
  grafana:
    image: grafana/grafana
    container_name: grafana
    labels:
      app: "grafana"
      service: "grafana"
    ports:
      - 13000:3000
    volumes:
      - ./grafana-provisioning:/etc/grafana/provisioning
      - ./grafana-dashboard:/dashboard
    depends_on:
      - prometheus

  # k6 — 부하 테스트 도구
  k6:
    image: grafana/k6
    container_name: k6
    labels:
      app: "k6"
      service: "k6"
    volumes:
      - ./k6-scripts:/scripts
    command: run -o experimental-prometheus-rw /scripts/load-test.js
    environment:
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - prometheus
      - hello-world
```

### 2) Alloy 설정

`.alloy` 파일을 통해 Alloy 에 대한 설정을 선언한다. OTel Collector 와 비슷한 receiver → processor → exporter 구조이지만, node_exporter · cAdvisor · MySQL · Redis · Blackbox exporter 가 내장 컴포넌트(`prometheus.exporter.*`)로 제공된다는 점이 핵심이다.

```hcl
// ==========================================
// 공통 라벨 정의 (모든 메트릭에 적용)
// ==========================================
prometheus.remote_write "prom" {
  endpoint { url = sys.env("PROMETHEUS_REMOTE_WRITE_URL") }

  external_labels = {
    environment = sys.env("ENVIRONMENT"),
    service_name = sys.env("APP_NAME"),
  }
}

// OTLP 수신기: OpenTelemetry 데이터를 HTTP/gRPC 로 수신
otelcol.receiver.otlp "in" {
  http { endpoint = "0.0.0.0:4318" }
  grpc { endpoint = "0.0.0.0:4317" }
  output {
    metrics = [otelcol.processor.batch.metrics.input]
    logs    = [otelcol.processor.transform.logs_to_loki.input]
    traces  = [otelcol.processor.batch.traces.input]
  }
}

// Metrics 배치 프로세서
otelcol.processor.batch "metrics" {
  timeout = "5s"
  send_batch_size = 1024
  send_batch_max_size = 2048
  output { metrics = [otelcol.exporter.prometheus.to_prom.input] }
}

// ==========================================
// Node Exporter — 호스트 CPU/메모리/디스크 메트릭 수집
// docker-compose.yml 에서 /:/host, /proc:/host/proc, /sys:/host/sys 마운트 필요
// ==========================================
prometheus.exporter.unix "node" {
  rootfs_path = "/host"
  procfs_path = "/host/proc"
  sysfs_path  = "/host/sys"

  enable_collectors  = ["cpu", "meminfo", "diskstats", "filesystem", "netdev", "loadavg", "uname"]
  disable_collectors = ["perf", "hwmon"]

  disk {
    device_include = "^(sda|nvme|disk).*"
  }

  filesystem {
    fs_types_exclude     = "^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$"
    mount_points_exclude = "^/(dev|proc|run/credentials/.+|sys|var/lib/docker/.+)($|/)"
  }
}

discovery.relabel "node_labels" {
  targets = prometheus.exporter.unix.node.targets

  rule {
    action       = "replace"
    replacement  = "node"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "node"
  }
}

prometheus.scrape "node_exporter" {
  targets         = discovery.relabel.node_labels.output
  forward_to      = [prometheus.remote_write.prom.receiver]
  scrape_interval = "15s"
  job_name        = "node"

  clustering { enabled = false }
}

// ==========================================
// cAdvisor Exporter — Docker 컨테이너 메트릭 수집
// docker-compose.yml 에서 /var/run/docker.sock 마운트 필요
// ==========================================
prometheus.exporter.cadvisor "cadvisor_exporter" {
  docker_host             = "unix:///var/run/docker.sock"
  storage_duration        = "2m"
  docker_only             = true
  store_container_labels  = true
}

discovery.relabel "cadvisor_labels" {
  targets = prometheus.exporter.cadvisor.cadvisor_exporter.targets

  rule {
    action       = "replace"
    replacement  = "cadvisor"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "cadvisor"
  }
}

prometheus.scrape "cadvisor" {
  targets         = discovery.relabel.cadvisor_labels.output
  forward_to      = [prometheus.remote_write.prom.receiver]
  scrape_interval = "15s"
  job_name        = "cadvisor"

  clustering { enabled = false }
}

// ==========================================
// MySQL Exporter
// 환경 변수: MYSQL_EXPORTER_USER, MYSQL_EXPORTER_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE
// ==========================================
prometheus.exporter.mysql "mysql_exporter" {
  data_source_name  = sys.env("MYSQL_EXPORTER_USER") + ":" + sys.env("MYSQL_EXPORTER_PASSWORD") + "@(" + sys.env("MYSQL_HOST") + ":" + sys.env("MYSQL_PORT") + ")/" + sys.env("MYSQL_DATABASE")
  disable_collectors = ["slave_status"]
}

discovery.relabel "mysql_labels" {
  targets = prometheus.exporter.mysql.mysql_exporter.targets

  rule {
    action       = "replace"
    replacement  = "mysql"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "mysql"
  }

  rule {
    target_label = "database"
    replacement  = sys.env("MYSQL_DATABASE")
  }
}

prometheus.scrape "mysql" {
  targets         = discovery.relabel.mysql_labels.output
  forward_to      = [prometheus.remote_write.prom.receiver]
  job_name        = "mysql"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering { enabled = false }
}

// ==========================================
// Redis Exporter
// 환경 변수: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
// ==========================================
prometheus.exporter.redis "redis_exporter" {
  redis_addr     = sys.env("REDIS_HOST") + ":" + sys.env("REDIS_PORT")
  redis_password = sys.env("REDIS_PASSWORD")
}

discovery.relabel "redis_labels" {
  targets = prometheus.exporter.redis.redis_exporter.targets

  rule {
    action       = "replace"
    replacement  = "redis"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "redis"
  }
}

prometheus.scrape "redis" {
  targets         = discovery.relabel.redis_labels.output
  forward_to      = [prometheus.remote_write.prom.receiver]
  job_name        = "redis"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering { enabled = false }
}

// ==========================================
// Blackbox Exporter — Spring Boot Actuator health endpoint 모니터링
// 환경 변수: API_HOST, API_PORT, API_HEALTH_CHECK_PATH
// ==========================================
prometheus.exporter.blackbox "health_check" {
  config = "{ modules: { http_2xx: { prober: http, timeout: 5s } } }"

  target {
    name    = "api-health"
    address = sys.env("API_HOST") + ":" + sys.env("API_PORT") + sys.env("API_HEALTH_CHECK_PATH")
    module  = "http_2xx"
  }
}

discovery.relabel "blackbox_labels" {
  targets = prometheus.exporter.blackbox.health_check.targets

  rule {
    action       = "replace"
    replacement  = "blackbox"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "blackbox"
  }

  rule {
    target_label = "probe_target"
    replacement  = "api"
  }
}

prometheus.scrape "blackbox" {
  targets         = discovery.relabel.blackbox_labels.output
  forward_to      = [prometheus.remote_write.prom.receiver]
  job_name        = "blackbox"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering { enabled = false }
}

// Prometheus Exporter: OTel metrics → Prometheus 로 내보냄
otelcol.exporter.prometheus "to_prom" {
  forward_to = [prometheus.remote_write.prom.receiver]
}

// Logs 변환 프로세서: Loki 로 전송할 로그 포맷 변환
otelcol.processor.transform "logs_to_loki" {
  error_mode = "ignore"
  log_statements {
    context = "resource"
    statements = [
      "set(resource.attributes[\"loki.resource.labels\"], \"service.name,service.instance.id,service.namespace\")",
    ]
  }
  output { logs = [otelcol.exporter.loki.to_loki.input] }
}

// Loki Exporter
otelcol.exporter.loki "to_loki" {
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint { url = sys.env("LOKI_PUSH_URL") }
}

// Traces 배치 프로세서 → Tempo 로 전송
otelcol.processor.batch "traces" {
  timeout             = "5s"
  send_batch_size     = 1024
  send_batch_max_size = 2048
  output { traces = [otelcol.exporter.otlp.to_tempo.input] }
}

otelcol.exporter.otlp "to_tempo" {
  client {
    endpoint = sys.env("TEMPO_ENDPOINT")
    tls { insecure = sys.env("TEMPO_TLS_INSECURE") == "true" }
  }
}
```

# 결론 🎯

OpenTelemetry Collector 는 강결합 없이 다양한 신호를 하나의 파이프라인으로 수집·변환·전송할 수 있는 표준 구조를 제공한다. 하지만 node_exporter, cAdvisor, mysqld_exporter 등 인프라 감시 도구를 별도로 관리해야 한다는 운영 부담이 남는다.

Grafana Alloy 는 이 간극을 메운다. exporter 를 내장 컴포넌트로 포함하고 있어 `docker-compose.yml` 을 크게 단순화할 수 있고, `.alloy` 설정 파일 하나에서 metrics · logs · traces · profiling 전 파이프라인을 관리할 수 있다. 성능 테스트 보고서처럼 관찰 대상이 다양한 상황에서는 Alloy 를 선택하는 것이 운영 비용 측면에서 유리하다.

[^1]: https://opentelemetry.io/docs/languages/
[^2]: https://opentelemetry.io/docs/specs/otlp/
[^3]: https://opentelemetry.io/docs/collector/deployment/
[^4]: https://opentelemetry.io/docs/collector/architecture/
[^5]: https://opentelemetry.io/docs/languages/js/exporters/
[^6]: https://www.elastic.co/kr/what-is/opentelemetry
[^7]: https://grafana.com/docs/alloy/latest/
[^8]: https://grafana.com/docs/alloy/latest/get-started/deploy/
[^9]: https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.exporter.mysql/
[^10]: https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.exporter.unix/
[^11]: https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.exporter.cadvisor/
[^12]: https://grafana.com/docs/grafana-cloud/send-data/alloy/
