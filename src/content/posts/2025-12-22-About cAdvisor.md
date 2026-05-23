---
description: "어떻게 하면 배포한 컨테이너들에 대한 시스템 메트릭을 모니터링할 수 있을까?"
tags: [journal]
lang: ko
draft: false
---

# Why?

컨테이너에 대해서만 커널과 프로세스와 같은 시스템 메트릭을 보고 싶을 때가 있다. 이를 직접 프로세스 레벨을 훔쳐서 OTLP 로 보내도 되지만, 서버나 환경이 다양한 경우 제한사항이 존재한다. CAdvisor 를 사용하면 코드 없이 간단히 설정하여 수집하게 할 수 있다.

그렇다면 CAdvisor 는 무엇이고 어떻게 동작하는지 알아보자.

# What?

![](/images/velog/41dced71003e3a11.png)

![](/images/velog/b9d62ccbdb86c23e.png)

## 정의 📌

컨테이너 어드바이저(cAdvisor)는 Google이 개발한 오픈소스 컨테이너 모니터링 도구다. 파일 시스템 및 네트워크 정보, CPU, 메모리 사용량 등 컨테이너 기반 메트릭을 수집, 집계, 처리 및 내보낼 수 있다.

이 도구는 단일 쿠버네티스 클러스터부터 완전한 도커 설치 환경에 이르기까지 모든 컨테이너화된 환경에서 사용하기 쉽다. 다용도성, 사용 편의성, 거의 모든 모니터링 요구 사항을 충족할 수 있는 능력 덕분에 cAdvisor는 컨테이너 모니터링을 위한 최고의 선택지 중 하나다.

## 제공 기능 🔧

- 다양한 컨테이너 유형에 대한 기본 제공 지원 및 Docker 컨테이너에 대한 네이티브 지원
- 노드 내 컨테이너 자동 위치 파악 및 데이터 수집
- Kubernetes의 DaemonSet, Docker 컨테이너, OS 독립 실행형 프로그램 등 다양한 구현 방법
- 추가 처리 및 분석을 위한 데이터 내보내기(Prometheus, Elasticsearch, InfluxDB 등 스토리지 플러그인 지원)
- 획득한 데이터의 메트릭을 실시간으로 표시하는 내장형 웹 사용자 인터페이스(UI)
- 루트 컨테이너 분석을 통한 전체 노드 리소스 소비량 보고 기능
- cAdvisor 컨테이너 메트릭을 직접 쿼리할 수 있는 강력한 REST API

## 단점 및 제한점 ⚠️

- cAdvisor는 기본적인 리소스 사용량 데이터만 수집하므로, 더 상세한 메트릭이 필요한 경우에는 충분하지 않을 수 있다.
- 메트릭 수집을 위해서는 운영체제마다 다른 설정이 필요하다. 예를 들어, RHEL과 CentOS는 특권 모드에서 실행해야 하는 반면, Debian은 메모리 cgroups를 활성화해야 한다.
- GPU와 같은 맞춤형 하드웨어 데이터 수집을 위해서는 추가 구성이 필요하며, 이 구성은 기반 인프라에 따라 달라진다.
- cAdvisor가 실행 중인 상태에서 런타임 옵션을 변경하려면 업데이트된 매개변수로 cAdvisor 컨테이너를 재시작해야 한다. 즉, 사용자는 기존 cAdvisor 컨테이너를 중지한 후 원하는 구성 변경 사항을 적용하여 새 컨테이너를 시작해야 한다.
- 추가 분석을 수행하고 수집된 데이터를 장기간 저장하려면 cAdvisor는 외부 도구가 필요하다.

## 기본 동작 원리 ⚙️

cAdvisor가 Docker 컨테이너로 실행될 경우, 다른 컨테이너를 모니터링하기 위해 호스트의 컨테이너 런타임 및 파일 시스템에 접근할 수 있어야 한다. 핵심은 필요한 호스트 디렉터리를 cAdvisor 컨테이너에 마운트하는 것이다:

1. **Docker 소켓 접근**: **`volume=/var/run:/var/run:ro`** 마운트는 cAdvisor가 Docker 데몬 소켓에 접근할 수 있게 하여 Docker와 통신하고 호스트에서 실행 중인 모든 컨테이너를 탐색할 수 있게 한다. running.md:9-17
2. **루트 파일시스템 접근**: **`volume=/:/rootfs:ro`** 마운트는 호스트의 전체 파일 시스템에 대한 접근을 제공하며, cAdvisor는 이를 통해 컨테이너 데이터를 읽는다.
3. **Cgroup 접근**: **`volume=/sys:/sys:ro`** 마운트는 cAdvisor가 모든 컨테이너의 cgroup 정보를 읽을 수 있도록 한다.

```bash
sudo docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=8080:8080 \
  --detach=true \
  --name=cadvisor \
  --privileged \
  --device=/dev/kmsg \
  gcr.io/cadvisor/cadvisor:$VERSION
```

## Docker Compose 환경에서의 작동 방식 🐳

Docker Compose 설정에서 cAdvisor를 다른 컨테이너와 함께 실행할 때 cAdvisor는 다음 이유로 모든 컨테이너를 모니터링할 수 있다:

1. **공유 Docker 데몬**: Docker Compose 배포 환경의 모든 컨테이너는 호스트의 동일한 Docker 데몬을 공유한다.

2. **컨테이너 감지**: cAdvisor의 Docker 팩토리는 Docker 클라이언트를 사용하여 컨테이너를 검사하고 발견한다. [factory.go:167-184](https://github.com/google/cadvisor/blob/5adb1c3b/container/docker/factory.go#L167) `ContainerInspect()`를 호출하여 컨테이너가 실행 중이며 Docker에 인식되는지 확인한다. [factory.go:178-181](https://github.com/google/cadvisor/blob/5adb1c3b/container/docker/factory.go#L167)

    ```go
    // Docker handles all containers under /docker
    func (f *dockerFactory) CanHandleAndAccept(name string) (bool, bool, error) {
    	// if the container is not associated with docker, we can't handle it or accept it.
    	if !dockerutil.IsContainerName(name) {
    		return false, false, nil
    	}

    	// Check if the container is known to docker and it is active.
    	id := dockerutil.ContainerNameToId(name)

    	// We assume that if Inspect fails then the container is not known to docker.
    	ctnr, err := f.client.ContainerInspect(context.Background(), id)
    	if err != nil || !ctnr.State.Running {
    		return false, true, fmt.Errorf("error inspecting container: %v", err)
    	}

    	return true, true, nil
    }

    ```

3. **네임스페이스 처리**: 매니저는 /rootfs/proc의 존재 여부를 확인하여 cAdvisor가 호스트 네임스페이스에서 실행 중인지 감지한다. [manager.go:183-188](https://github.com/google/cadvisor/blob/5adb1c3b/manager/manager.go) 호스트 네임스페이스가 아닌 경우(컨테이너화됨), 경로 앞에 /rootfs를 접두사로 추가하여 경로를 조정한다. [handler.go:138-142](https://github.com/google/cadvisor/blob/5adb1c3b/container/docker/handler.go#L112)

    ```go
    	rootFs := "/"
    	if !inHostNamespace {
    		rootFs = "/rootfs"
    		storageDir = path.Join(rootFs, storageDir)
    	}
    ```

4. **컨테이너 핸들러 생성**: 발견된 각 컨테이너에 대해 cAdvisor는 마운트된 볼륨을 사용하여 컨테이너 데이터에 접근하는 핸들러를 생성한다. [manager.go:913-931](https://github.com/google/cadvisor/blob/5adb1c3b/manager/manager.go) 컨테이너화된 상태로 실행될 때 핸들러는 inHostNamespace를 false로 설정하여 초기화된다. [manager.go:185-188](https://github.com/google/cadvisor/blob/5adb1c3b/manager/manager.go)

    ```go
    func (m *manager) createContainerLocked(containerName string, watchSource watcher.ContainerWatchSource) error {
    	namespacedName := namespacedContainerName{
    		Name: containerName,
    	}

    	// Check that the container didn't already exist.
    	if _, ok := m.containers[namespacedName]; ok {
    		return nil
    	}

    	handler, accept, err := container.NewContainerHandler(containerName, watchSource, m.containerEnvMetadataWhiteList, m.inHostNamespace)
    	if err != nil {
    		return err
    	}
    	if !accept {
    		// ignoring this container.
    		klog.V(4).Infof("ignoring container %q", containerName)
    		return nil
    	}
    	collectorManager, err := collector.NewCollectorManager()
    	if err != nil {
    		return err
    	}

    	logUsage := *logCadvisorUsage && containerName == m.cadvisorContainer
    	cont, err := newContainerData(containerName, m.memoryCache, handler, logUsage, collectorManager, m.maxHousekeepingInterval, m.allowDynamicHousekeeping, clock.RealClock{})
    	if err != nil {
    		return err
    	}

    	,,,,

    }
    ```

## 필수요건 ✅

중요한 요구 사항은 cAdvisor 컨테이너가 Docker 소켓과 호스트 파일 시스템에 접근하기 위해 적절한 볼륨 마운트를 가져야 한다는 것이다. 이러한 마운트가 없으면 cAdvisor는 동일한 Docker Compose 배포에 있더라도 다른 컨테이너를 검색하거나 모니터링할 수 없다.

일부 시스템(RHEL/CentOS 등)에서는 cAdvisor가 Docker 데몬에 충분한 접근 권한을 얻기 위해 --privileged 플래그가 필요할 수도 있다.

# How?

?

### 1) Container

아래와 같이 `docker-compose.yml` 선언

```yaml
services:
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

1. `/:/rootfs:ro` — 호스트 루트 파일시스템 (읽기 전용). 전체 파일시스템 구조 접근으로 컨테이너 정보 수집.
2. `/var/run:/var/run:ro` — 실행 중인 프로세스 및 소켓 정보. Docker 소켓 및 런타임 정보 접근.
3. `/sys:/sys:ro` — 시스템 정보 및 커널 통계. CPU, 메모리, 네트워크 인터페이스 정보 수집.
4. `/var/lib/docker/:/var/lib/docker:ro` — Docker 컨테이너 메타데이터 및 로그. 컨테이너별 상세 정보 및 통계 수집.
5. `/dev/disk/:/dev/disk:ro` — 디스크 디바이스 정보. 컨테이너별 디스크 I/O 통계 수집.
6. `devices: /dev/kmsg` — 커널 메시지 버퍼 접근. 시스템 로그 및 이벤트 모니터링.


>
> 이외 플래그 값들에 대해서는 아래를 추가로 살펴보자
>
> https://github.com/google/cadvisor/blob/master/docs/runtime_options.md

### 2) otel-receiver 레벨에서 필터링 처리

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

# ,,, processor 나 exporter 에 대해서는 생략 ,,,
```

[^1]: <https://cast.ai/blog/cadvisor/>

[^2]: <https://deepwiki.com/search/how-cadvisor-collect-container_c2b22e92-8089-4b56-abb7-ff410e682c4f?mode=fast>

[^3]: <https://github.com/google/cadvisor/blob/5adb1c3b/docs/running.md>

[^4]: <https://prometheus.io/docs/guides/cadvisor/>
