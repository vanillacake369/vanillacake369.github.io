---
description: "관찰대상에 대한 데이터 수집 표준인 OpenTelemetry 에 대해 알아보자"
date: 2025-12-22
tags: [journal]
lang: ko
draft: false
---

# Why?

사내 크롤링 프로젝트에 대한 성능테스트 보고서 도출이 필요하였다.

이에 따라 observability 에 대한 가이드라인 도색이 필요했고 전체적으로 아래와 같이 구성해보았다.

![](/images/velog/1d68a0cebcc482cf.png)

보다싶이 관찰해야할 대상이 한 두개가 아니였다.

관리자 백엔드 서버, 크롤링 백엔드 서버, 람다와 SQS, RDS 등등의 정보들이 필요했다.

또한 metric, log, trace 간단한 게 아니라 인스턴스의 상태 체크나 컨테이너 상태 체크들을 확인해야했다.

( 그래야만 성능테스트 보고서를 작성할 수 있을 것이다 )

따라서 이를 한 곳으로 모아줄 collector 가 필요하고 흔히들 쓰는 open telemetry 를 구성할 필요가 있었다.

이에 대해 예시 구현 전에 개념학습 차원에서

1.

어떤 컴포넌트들이 있고 2.

어떤 역할을 하고 3.

이를 어떻게 구성하는지

학습해보았다.

# Open Telemetry 🔭

### 전체 처리과정

open telemetry 처리과정을 순서도를 그려보자면 아래와 같이 처리된다.

![](/images/velog/6269802e2e9ef425.png)

1. **앱에서 SDK 호출**

   언어별 OTel SDK가 트레이스/메트릭/로그를 만들고, **OTLP Exporter**로 내보내도록 환경변수/코드로 설정한다.

   https://opentelemetry.io/docs/languages/

2. **OTLP로 전송**

   **gRPC(4317)** 또는 **HTTP(4318)** 로 Collector의 OTLP endpoint에 보낸다.

   https://opentelemetry.io/docs/specs/otlp/?utm_source=chatgpt.com

3. **Receiver 수신**

   Collector의 **OTLP Receiver**가 수신한다.

공개 도메인은 **Gateway를 외부에 노출할 때만** 필요하고, 보통은 **동일 호스트/내부 네트워크/VPC**로 통신한다.

    **이에 대한 여러 패턴이 존재한다.

공식문서 상에선 배치 구조는 **Agent(로컬) → Gateway(중앙)**가 권장된다.

    https://opentelemetry.io/docs/collector/deployment/

4. **Processor 처리**

   N 개의 파이프라인을 통해 필요한 전처리한다(예: `redaction`으로 민감정보 제거).

   \*\*필터 역할만 하는 게 아니라 backpressure 역할(batch, memory_limiter), 라벨링 (attributes, resource), 라우팅(routing) 등등을 처리한다.

   https://opentelemetry.io/docs/collector/architecture/?utm_source=chatgpt.com

5. **Exporter 전송**

   백엔드별 Exporter로 Tempo/Jaeger/Prometheus/Loki 등으로 내보내고, Grafana 등에서 시각화한다.

   https://opentelemetry.io/docs/languages/js/exporters/

### [Collector](https://opentelemetry.io/docs/collector/)

![](/images/velog/5d472e48a50efaef.png)

- 보다 보면 Collector 라는 개념이 나오는데 이것이 사실상 Open Telemetry 라고 할 수 있다.

> 💡
>
> **Why “collector” over “direct backend call” ?**
>
> 위와 같이 직접 옵저버 툴 OSS 를 호출하여 정보를 저장할 수도 있다.
>
> 하지만 이는 강결합을 일으켜 아래와 같은 단점을 불러일으킨다.
>
> - 옵저버 툴이 늘어나면 늘어날 수록 코드 수정이 늘어남
> - 각 옵저버 툴에 대한 부가적인 처리 패턴이 단편화됨
> - 언어별 구현체가 제한됨
>
> 결론적으로 Collector 는 강결합을 끊어주고 옵저버 데이터 처리과정을 하나로 응집시켜주는 딱풀 같은 역할을 하게 된다.
>
> 이것이 바로 Open Telemetry 의 존재 의의이다.
>
> https://www.elastic.co/kr/what-is/opentelemetry#:~:text=%EC%84%A4%EB%AA%85%EC%84%9C%EB%A5%BC%20%EC%B0%B8%EC%A1%B0%ED%95%98%EC%84%B8%EC%9A%94.-,OpenTelemetry%EC%9D%98%20%EA%B0%84%EB%9E%B5%ED%95%9C%20%EC%97%AD%EC%82%AC,-OpenTelemetry%20%EC%9D%B4%EC%A0%84%EC%97%90%EB%8A%94%20%EC%97%85%EA%B3%84%EA%B0%80

### [수집한 데이터를 Collector 로 보내는 여러 패턴](https://opentelemetry.io/docs/collector/deployment/)

수집한 데이터를 Collector 로 보내는 패턴은 공식문서 상 세 가지 방법으로 소개된다.

( Collector 의 하위 컴포넌트인 Receiver 가 이를 처리한다.

Receiver 는 이따 알아보도록 하자. )

- 백엔드툴에 직접 전송
  ![](/images/velog/7cbf7762a5ab42cb.png)
- Application 에 OTLP 담당 에이전트를 심어 전송
  ![](/images/velog/8393530cad8c58ed.png)
- 게이트웨이 처리
  ![](/images/velog/33047be93e8af802.png)

우선은 실습을 진행해봐야 알 거 같다.

대부분의 데모는 2번안으로 진행하니 2번안으로 실습을 진행해보자

(3번은 k8s 와 같이 open telemetry 를 클러스터링 했을 때의 이야기이다)

## Open Telemetry 실습

> 💡
>
> **docker compose 설정 중 network_mode 에 대하여,,,**
>
> 만약 docker compose 로 모니터링 스택을 구성하고 있다면 network_mode 를 아래와 같이 host 로 구성하면 안 된다. “안 된다”
>
> ```yaml
> # ❌
> services:
>   node-exporter:
>     image: prom/node-exporter
>     network_mode: host
> ```

왜냐하면 보통 Docker 내부 브리지 네트워크(`bridge` 혹은 `default`)를 통해 이루어지는데,

`network_mode: host` 는 컨테이너가 호스트(OS)의 네트워크 스택을 그대로 공유하는 모드이므로 다른 컨테이너와 통신을 할 수 없기 때문이다.

따라서 다른 모니터링 컨테이너들과 동일한 네트워크 선상에 있도록 세팅하는 것이 중요하다.

</aside>

### 1) 컨테이너 구성

각 exporter 와 서비스, 그리고 open telemetry 구성을 위해 아래와 같이 docker compose 를 작성한다.

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

  # k6
  # 부하 테스트 도구
  # 테스트 완료 후 컨테이너 자동 종료 (일회성 실행)
  # 지속적 테스트가 필요하면 restart: always 추가
  k6:
    image: grafana/k6
    volumes:
      - ./k6-scripts:/scripts
    command: run -o experimental-prometheus-rw /scripts/load-test.js
    # k6 메트릭을 Prometheus로 전송하기 위한 환경 변수
    environment:
      # Prometheus Remote Write 엔드포인트 URL
      # k6 테스트 결과를 실시간으로 Prometheus에 전송
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      # Trend 메트릭을 Native Histogram으로 전송
      # 더 정확한 백분위수(p95, p99) 계산 가능
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
    # Docker 컨테이너에서 호스트 머신 접근을 위한 특수 호스트 매핑
    # 컨테이너 내부에서 host.docker.internal로 호스트의 localhost 접근 가능
    # 예: 호스트의 8000 포트 서비스를 http://host.docker.internal:8000으로 접근
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
      # 호스트 루트 파일시스템 (읽기 전용)
      # 전체 파일시스템 구조 접근으로 컨테이너 정보 수집
      - /:/rootfs:ro
      # 실행 중인 프로세스 및 소켓 정보
      # Docker 소켓 및 런타임 정보 접근
      - /var/run:/var/run:ro
      # 시스템 정보 및 커널 통계
      # CPU, 메모리, 네트워크 인터페이스 정보 수집
      - /sys:/sys:ro
      # Docker 컨테이너 메타데이터 및 로그
      # 컨테이너별 상세 정보 및 통계 수집
      - /var/lib/docker/:/var/lib/docker:ro
      # 디스크 디바이스 정보
      # 컨테이너별 디스크 I/O 통계 수집
      - /dev/disk/:/dev/disk:ro
    # 시스템 레벨 접근 권한 필요 (cgroup, namespace 접근)
    privileged: true
    devices:
      # 커널 메시지 버퍼 접근
      # 시스템 로그 및 이벤트 모니터링
      - /dev/kmsg
```

### 2) open telemetry 설정

이후 각 exporter 혹은 prometheus, loki, tempo 등등에 대해 open telemetry 설정을 아래와 같이 선언한다.

```yaml
# ====== receivers 선언부 ======
# https://opentelemetry.io/docs/collector/configuration/#receivers
receivers:
  # 웹 서버 컨테이너로부터
  # metric, log, trace 전송받음 (OTLP 프로토콜)
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  # Node Exporter로부터 시스템 메트릭 수집
  # Prometheus 스크랩 방식으로 수집
  prometheus:
    config:
      scrape_configs:
        # Node Exporter
        - job_name: "node-exporter"
          scrape_interval: 15s
          static_configs:
            - targets: ["node_exporter:9100"]
        # CAdvisor
        # metric_relabel_configs 을 통해
        # hello-world 에 대해서만 수집하도록 필터링
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
  # Data sources: traces
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
  # Prometheus Remote Write로 메트릭 전송
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    tls:
      insecure: true

# ====== extensions 선언부 ======
# collector 자체에 대한 extension (상태체크, 프로세스체크 등등)
# https://opentelemetry.io/docs/collector/configuration/#extensions
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
  pprof:
    endpoint: 0.0.0.0:1777
  zpages:
    endpoint: 0.0.0.0:55679

# ====== service 선언부 ======
# 콜렉터에서 활성화될 구성 요소를 설정하는 데 사용됨
# 구성 요소가 설정되었지만 서비스 섹션 내에서 정의되지 않은 경우
# 해당 구성 요소는 활성화되지 않음
service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    # traces와 logs는 일단 비활성화 (메트릭만 집중)
    # traces:
    #   receivers: [otlp]
    #   processors: [attributes]
    #   exporters: [prometheusremotewrite]

    metrics:
      # Node Exporter 메트릭 수집 후 Prometheus로 전송
      receivers: [prometheus]
      exporters: [prometheusremotewrite]

    # logs:
    #   receivers: [otlp]
    #   exporters: [prometheusremotewrite]
```

# Grafana Alloy ☀️

## What Alloy ?

Alloy는 Grafana Labs에서 제공하는 오픈소스(또는 오픈소스 기반) 텔레메트리 수집기(collector)입니다.

공식 문서에 따르면 다음과 같은 특징이 있습니다. ([Grafana Labs](https://grafana.com/docs/grafana-cloud/send-data/alloy/) 참고)

- “Collect all your telemetry with one product”라는 슬로건처럼 다양한 신호(metrics, logs, traces, profiling)를 한 제품으로 수집·처리·전송할 수 있습니다.
- Prometheus pipeline + OpenTelemetry receiver가 네이티브로 통합되어 있어, 기존 Prometheus + OTel 구성에서 사용하던 많은 기술을 흡수하고 있습니다.
- “Infrastructure + Application” 양쪽 감시에 적합하도록 설계되어 있으며, 클러스터링, DaemonSet 기반 배포, 확장성 등 엔터프라이즈 요구사항도 고려되어 있습니다.

즉, OTel Collector 단독으로 구성했을 때보다

**“인프라 감시를 위한 익스포터(exporter)/스크레이퍼(scraper)까지 포함된 통합형”** 으로 볼 수 있습니다.

## Open Telemetry 보다 좋은 게 뭔대?

| 항목              | OTel Collector만 또는 Prometheus+Exporter 방식                                                | Alloy 방식의 장점                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 구성 복잡성       | 여러 도구(node_exporter, cAdvisor, mysqld_exporter, Prometheus scrape 설정 등) 설치·관리 필요 | Exporter 기능이 통합된 Alloy 하나로 많은 구성 단순화                                                          |
| 메트릭 종류       | 인프라/컨테이너/DB 메트릭 별도 구성 필요                                                      | 인프라, 컨테이너, DB 메트릭까지 내장 컴포넌트로 지원                                                          |
| 운영 일관성       | 메트릭별 도구가 달라 라벨/스크레이프 방식 통일 어려움                                         | 하나의 수집기로 통합되어 라벨/비헤이비어 일관성 확보                                                          |
| 확장성/배포유형   | 도구별 배포 전략 다를 수 있음                                                                 | Alloy는 호스트 데몬, DaemonSet, StatefulSet 등 다양하게 지원됨 ([Grafana Labs][4])                            |
| 유지보수 비용     | 여러 도구 각각 업그레이드·설정해야 함                                                         | Alloy로 통합되면 설정·업그레이드 관리 범위 축소 가능                                                          |
| 커스터마이징 여지 | 각 exporter 별 설정이나 Prometheus 리모트라이트 구성 필요                                     | Alloy 설정 파일 하나에서 다양한 컴포넌트 관리 가능 (예: `prometheus.exporter.mysql` 설정) ([Grafana Labs][7]) |

## Grafana Alloy 실습

### 1) 컨테이너 구성

각 서비스, 그리고 alloy 구성을 위해 아래와 같이 docker compose 를 작성한다.

중요한 차이점은 alloy 는 내장된 컴포넌트가 많아 대부분의 컴포넌트가 docker compose 에서 선언되지 않고 alloy 하나로 처리된다는 점이다.

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

  # Alloy
  # OpenTelemetry Collector 대체 + 내장 Node Exporter/cAdvisor 사용
  alloy:
    image: grafana/alloy:latest
    container_name: alloy
    labels:
      app: "alloy"
      service: "alloy"
    volumes:
      # Alloy 설정 파일
      - ./alloy/config.alloy:/etc/alloy/config.alloy:ro
      # cAdvisor 기능을 위한 Docker 소켓 접근 (컨테이너 메트릭 수집)
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # Node Exporter 기능을 위한 호스트 파일시스템 접근 (시스템 메트릭 수집)
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
    # cAdvisor 기능을 위한 호스트 PID 네임스페이스 공유
    pid: host
    # 시스템 레벨 메트릭 수집을 위한 권한
    privileged: true
    environment:
      # Node Exporter가 호스트 파일시스템을 인식하도록 설정
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

  # k6
  # 부하 테스트 도구
  # 테스트 완료 후 컨테이너 자동 종료 (일회성 실행)
  # 지속적 테스트가 필요하면 restart: always 추가
  k6:
    image: grafana/k6
    container_name: k6
    labels:
      app: "k6"
      service: "k6"
    volumes:
      - ./k6-scripts:/scripts
    command: run -o experimental-prometheus-rw /scripts/load-test.js
    # k6 메트릭을 Prometheus로 전송하기 위한 환경 변수
    environment:
      # Prometheus Remote Write 엔드포인트 URL
      # k6 테스트 결과를 실시간으로 Prometheus에 전송
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
      # Trend 메트릭을 Native Histogram으로 전송
      # 더 정확한 백분위수(p95, p99) 계산 가능
      - K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
    # Docker 컨테이너에서 호스트 머신 접근을 위한 특수 호스트 매핑
    # 컨테이너 내부에서 host.docker.internal로 호스트의 localhost 접근 가능
    # 예: 호스트의 8000 포트 서비스를 http://host.docker.internal:8000으로 접근
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - prometheus
      - hello-world
```

### 2) alloy 설정

이후 .alloy 파일을 통해 alloy 에 대한 설정을 한다.

alloy 도 open telemetry 와 비슷한 구조를 가지고 있지만 exporter 를 내부 탑재하고 있다는 부분에서, docker container 에 대한 추가 관리를 한 곳에서 할 수 있다는 장점이 존재한다.

```yaml
// ==========================================
// 공통 라벨 정의 (모든 메트릭에 적용)
// ==========================================
prometheus.remote_write "prom" {
  endpoint { url = sys.env("PROMETHEUS_REMOTE_WRITE_URL") }

  // OpenTelemetry 표준 준수
  external_labels = {
    // 환경 구분 (dev, staging, prod)
    environment = sys.env("ENVIRONMENT"),  // 기존 SERVICE_ROLE 대체

    // 서비스 식별 (OpenTelemetry 표준)
    service_name = sys.env("APP_NAME"),  // newsclipping-api
  }
}

// OTLP 수신기: OpenTelemetry 데이터를 HTTP/GRPC로 수신
otelcol.receiver.otlp "in" {
  http { endpoint = "0.0.0.0:4318" }
  grpc { endpoint = "0.0.0.0:4317" }
  // 수신된 metrics/logs를 프로세서로 전달
  output {
    metrics = [otelcol.processor.batch.metrics.input]
    logs    = [otelcol.processor.transform.logs_to_loki.input]
    traces  = [otelcol.processor.batch.traces.input]
  }
}

// Metrics 배치 프로세서: metrics를 배치로 묶어 전달
otelcol.processor.batch "metrics" {
  timeout = "5s"
  send_batch_size = 1024
  send_batch_max_size = 2048
  // Prometheus Exporter로 metrics 전달
  output { metrics = [otelcol.exporter.prometheus.to_prom.input] }
}

// ==========================================
// Node Exporter
// @임지훈
// ==========================================
// 호스트 시스템의 CPU, 메모리, 디스크 메트릭 수집
// docker-compose.yml에서 /:/host, /proc:/host/proc, /sys:/host/sys 마운트 필요
prometheus.exporter.unix "node" {
  // 호스트 파일시스템 경로 지정 (컨테이너 내부 마운트 경로)
  rootfs_path = "/host"
  procfs_path = "/host/proc"
  sysfs_path = "/host/sys"

  // 수집할 collector 지정
  enable_collectors = ["cpu", "meminfo", "diskstats", "filesystem", "netdev", "loadavg", "uname"]

  // 성능 문제를 일으킬 수 있는 collector 비활성화
  disable_collectors = ["perf", "hwmon"]

  // 디스크 필터링 (sda, nvme 디스크만 수집)
  disk {
    device_include = "^(sda|nvme|disk).*"
  }

  // 파일시스템 필터링 (tmpfs, devtmpfs 등 제외)
  filesystem {
    fs_types_exclude = "^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$"
    mount_points_exclude = "^/(dev|proc|run/credentials/.+|sys|var/lib/docker/.+)($|/)"
  }
}

// Node exporter는 최소한의 라벨만 추가
discovery.relabel "node_labels" {
  targets = prometheus.exporter.unix.node.targets

  // job 라벨을 "node"로 교체
  rule {
    action       = "replace"
    replacement  = "node"
    target_label = "job"
  }

  // exporter 타입만 명시 (쿼리 시 구분용)
  rule {
    target_label = "exporter"
    replacement  = "node"
  }
}

// Node Exporter가 노출한 메트릭을 스크랩하여 Prometheus로 전송
prometheus.scrape "node_exporter" {
  targets = discovery.relabel.node_labels.output
  forward_to = [prometheus.remote_write.prom.receiver]
  scrape_interval = "15s"
  job_name = "node"  // 간결하게

  clustering {
    enabled = false
  }
}

// ==========================================
// cAdvisor Exporter
// ==========================================
// Docker 컨테이너의 CPU, 메모리, 네트워크, 디스크 메트릭 수집
// docker-compose.yml에서 Docker 소켓 마운트 필요: /var/run/docker.sock:/var/run/docker.sock:ro
prometheus.exporter.cadvisor "cadvisor_exporter" {
  docker_host = "unix:///var/run/docker.sock"

  // 메트릭 저장 기간 (메모리 사용량 조절)
  storage_duration = "2m"

  // Docker 라벨만 수집 (Kubernetes 등 제외)
  docker_only = true

  // 컨테이너 라벨 포함
  store_container_labels = true

  // 화이트리스트: 수집할 컨테이너 지정 (정규식)
  // 설정하지 않으면 모든 컨테이너 수집 (루트 cgroup 포함)
  // 예: 특정 컨테이너만 수집하려면 아래 주석 해제
  // containerd_namespace = "moby"
  // docker_cadvisor_exporter = ["hello-world", "prometheus", "grafana"]

  // 주의: privileged 모드에서는 루트 cgroup(/)도 수집됨
  // 이를 방지하려면 메트릭 relabeling 필요 (아래 scrape 설정 참고)
}

discovery.relabel "cadvisor_labels" {
  targets = prometheus.exporter.cadvisor.cadvisor_exporter.targets

  // job 라벨을 "cadvisor"로 교체
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

// cAdvisor가 노출한 컨테이너 메트릭을 스크랩하여 Prometheus로 전송
prometheus.scrape "cadvisor" {
  targets = discovery.relabel.cadvisor_labels.output
  forward_to = [prometheus.remote_write.prom.receiver]
  scrape_interval = "15s"
  job_name = "cadvisor"

  clustering {
    enabled = false
  }
}

// ==========================================
// DATABASE MONITORING - MySQL Exporter
// @임지훈
// ==========================================
// MySQL 데이터베이스 메트릭 수집을 위한 mysqld-exporter 설정
// 참고: k6-exercise alloy mysqld-exporter configuration
//
// 필수 요구사항:
// 1. MySQL에 'exporter' 유저 생성 (V202511101700__create_mysqld_exporter_user.sql 실행)
// 2. docker-compose.yml에서 환경별 .env 파일 지정
//    - LOCAL: env_file: ./monitoring/alloy/.env.local
//    - DEV:   env_file: ./monitoring/alloy/.env.dev
//    - PROD:  env_file: ./monitoring/alloy/.env.prod
//
// 환경 변수 목록:
// - MYSQL_EXPORTER_USER: exporter 유저명
// - MYSQL_EXPORTER_PASSWORD: 환경별 비밀번호
// - MYSQL_HOST: 데이터베이스 호스트
// - MYSQL_PORT: 데이터베이스 포트 (기본: 3306)
// - MYSQL_DATABASE: 데이터베이스 이름 (prone_renew)
// ==========================================

// MySQL Exporter 설정
prometheus.exporter.mysql "mysql_exporter" {
  // Connection String 형식: username:password@(host:port)/database
  // 환경 변수로부터 MySQL 연결 정보를 주입받습니다
  // 설정: docker-compose.yml의 env_file (.env.local, .env.dev, .env.prod)
  data_source_name = sys.env("MYSQL_EXPORTER_USER") + ":" + sys.env("MYSQL_EXPORTER_PASSWORD") + "@(" + sys.env("MYSQL_HOST") + ":" + sys.env("MYSQL_PORT") + ")/" + sys.env("MYSQL_DATABASE")

  // slave_status collector 비활성화 (단일 인스턴스 환경에서는 불필요)
  disable_collectors = ["slave_status"]

  // 선택적 collector 설정 (필요 시 활성화)
  // collect.info_schema.processlist = true      // 프로세스 목록 수집
  // collect.info_schema.innodb_metrics = true   // InnoDB 메트릭 수집
  // collect.info_schema.tables = true           // 테이블 정보 수집
  // collect.info_schema.tablestats = true       // 테이블 통계 수집
  // collect.perf_schema.tableiowaits = true     // 테이블 I/O 대기 시간
  // collect.perf_schema.indexiowaits = true     // 인덱스 I/O 대기 시간
}

discovery.relabel "mysql_labels" {
  targets = prometheus.exporter.mysql.mysql_exporter.targets

  // job 라벨을 "mysql"로 교체
  rule {
    action       = "replace"
    replacement  = "mysql"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "mysql"
  }

  // 데이터베이스 식별 라벨 추가
  rule {
    target_label = "database"
    replacement  = sys.env("MYSQL_DATABASE")
  }
}

// MySQL Exporter 스크랩 설정
prometheus.scrape "mysql" {
  targets    = discovery.relabel.mysql_labels.output
  forward_to = [prometheus.remote_write.prom.receiver]
  job_name   = "mysql"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering {
    enabled = false
  }
}

// 주의사항:
// - slave_status collector 권한 오류는 단일 인스턴스 환경에서 무시 가능
//   (복제 설정이 필요한 환경에서만 중요)
// - 성능 영향을 고려하여 필요한 collector만 활성화 권장
// - data_source_name에 특수문자가 포함된 경우 URL 인코딩 필요

// ==========================================
// REDIS MONITORING - Redis Exporter
// @임지훈
// ==========================================
// Redis 인스턴스의 메트릭 수집을 위한 redis-exporter 설정
//
// 필수 요구사항:
// 1. docker-compose.yml에서 환경별 .env 파일 지정
//    - LOCAL: env_file: ./monitoring/alloy/.env.local
//    - DEV:   env_file: ./monitoring/alloy/.env.dev
//    - PROD:  env_file: ./monitoring/alloy/.env.prod
//
// 환경 변수 목록:
// - REDIS_HOST: Redis 호스트
// - REDIS_PORT: Redis 포트 (기본: 6379)
// - REDIS_PASSWORD: Redis 비밀번호 (선택사항)
// ==========================================

// Redis Exporter 설정
prometheus.exporter.redis "redis_exporter" {
  // Redis 연결 주소: host:port 형식
  // 환경 변수로부터 Redis 연결 정보를 주입받습니다
  redis_addr = sys.env("REDIS_HOST") + ":" + sys.env("REDIS_PORT")

  // Redis 비밀번호 (비어있으면 비밀번호 없이 연결)
  redis_password = sys.env("REDIS_PASSWORD")
}

discovery.relabel "redis_labels" {
  targets = prometheus.exporter.redis.redis_exporter.targets

  // job 라벨을 "redis"로 교체
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

// Redis Exporter 스크랩 설정
prometheus.scrape "redis" {
  targets    = discovery.relabel.redis_labels.output
  forward_to = [prometheus.remote_write.prom.receiver]
  job_name   = "redis"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering {
    enabled = false
  }
}

// 주의사항:
// - Redis 비밀번호가 설정되어 있지 않은 경우 REDIS_PASSWORD를 빈 문자열로 설정
// - Redis 클러스터 모드를 사용하는 경우 별도 설정 필요
// - 성능 영향을 고려하여 scrape_interval 조정 가능

// ==========================================
// HEALTH CHECK MONITORING - Blackbox Exporter
// @임지훈
// ==========================================
// Spring Boot Actuator health endpoint 모니터링
// HTTP probe를 통해 API 서버의 health 상태 확인
//
// 필수 요구사항:
// 1. docker-compose.yml에서 환경별 .env 파일 지정
//    - LOCAL: env_file: ./monitoring/alloy/.env.local
//    - DEV:   env_file: ./monitoring/alloy/.env.dev
//    - PROD:  env_file: ./monitoring/alloy/.env.prod
//
// 환경 변수 목록:
// - API_HOST: API 서버 호스트 (예: newsclipping-api)
// - API_PORT: API 서버 포트 (기본: 8080)
// ==========================================

// Blackbox Exporter 설정
prometheus.exporter.blackbox "health_check" {
  // inline으로 http_2xx 모듈 설정
  config = "{ modules: { http_2xx: { prober: http, timeout: 5s } } }"

  // Spring Boot Actuator health endpoint 타깃
  target {
    name    = "api-health"
    address = sys.env("API_HOST") + ":" + sys.env("API_PORT") + sys.env("API_HEALTH_CHECK_PATH")
    module  = "http_2xx"
  }
}

discovery.relabel "blackbox_labels" {
  targets = prometheus.exporter.blackbox.health_check.targets

  // job 라벨을 "blackbox"로 교체
  rule {
    action       = "replace"
    replacement  = "blackbox"
    target_label = "job"
  }

  rule {
    target_label = "exporter"
    replacement  = "blackbox"
  }

  // probe 대상 명시
  rule {
    target_label = "probe_target"
    replacement  = "api"
  }
}

// Blackbox Exporter 스크랩 설정
prometheus.scrape "blackbox" {
  targets    = discovery.relabel.blackbox_labels.output
  forward_to = [prometheus.remote_write.prom.receiver]
  job_name   = "blackbox"
  scrape_interval = "15s"
  scrape_timeout  = "10s"

  clustering {
    enabled = false
  }
}

// 주의사항:
// - Health check 실패 시 probe_success 메트릭이 0으로 설정됨
// - probe_duration_seconds 메트릭으로 응답 시간 측정 가능
// - API 서버가 시작되지 않은 경우 연결 실패 에러 발생 (정상)

// Prometheus Exporter: metrics를 Prometheus로 내보냄
otelcol.exporter.prometheus "to_prom" {
  forward_to = [prometheus.remote_write.prom.receiver]
}

// Logs 변환 프로세서: Loki로 전송할 로그 포맷 변환
otelcol.processor.transform "logs_to_loki" {
  error_mode = "ignore"
  log_statements {
    context = "resource"
    statements = [
      "set(resource.attributes[\"loki.resource.labels\"], \"service.name,service.instance.id,service.namespace\")",
    ]
  }
  // 변환된 로그를 Loki Exporter로 전달
  output { logs = [otelcol.exporter.loki.to_loki.input] }
}

// Loki Exporter: 로그를 Loki로 내보냄
otelcol.exporter.loki "to_loki" {
  forward_to = [loki.write.default.receiver]
}

// Loki write: Loki 서버로 로그 전송
loki.write "default" {
  endpoint { url = sys.env("LOKI_PUSH_URL") }
}

otelcol.processor.batch "traces" {
  timeout = "5s"
  send_batch_size = 1024
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
