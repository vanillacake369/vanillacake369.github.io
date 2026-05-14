---
title: "CKA 스터디"
description: "CKA 응시할 때 nvim 설정을 조작할 수 있을까 궁금하여 찾아보았다."
date: 2025-12-25
tags: [kubernetes]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

- 고가용성 컨테이너 구축을 위해서
- 인프라 엔지니어 전향을 위해서

# What?

뭘 배움?

---

---

> ☝ [https://www.inflearn.com/studies/1726641/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-cka-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%8A%A4%ED%84%B0%EB%94%94-%EB%AA%A8%EC%A7%91](https://www.inflearn.com/studies/1726641/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-cka-%EC%9E%90%EA%B2%A9%EC%A6%9D-%EC%B7%A8%EB%93%9D%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%8A%A4%ED%84%B0%EB%94%94-%EB%AA%A8%EC%A7%91)
> ☝ 2025.12.15 - 21 1주차 : 섹션 1,2,3

## Manual Scailing / HPA

manual

```bash
# 리소스 사용량 확인
kubectl top pod ${pod-name}.pod
# 수동으로 수평 확장
kubectl scale deployment ${deploy-name} --replicas=3
```

HPA

```bash
# HPA 매니저 활성화
kubectl autoscale ${deploy-name} --cpu-percent=50 --min=1 --max=10
# HPA 매니저 조회
kubectl get hpa
# HPA 매니저 삭제
kubectl delete hpa ${hpa-name}
```

In-Place Pod Resizing
pod 업데이트하고자 한다면 이전 pod 를 죽이고 새 pod 를 시작해야함
최근 베타로 in place update 를 지원할 수 있게 되었음
다만 CPU, memory 사용률만 변경 가능하며, 이외에 Pod Qos (????), Init Containers, Ephermeral Containers 등등은 교체가 불가능함

```bash
FEATURE_GATES=InPlacePodVerticalScailing=true
```

## Installing VPA

vpa manager 가 지속적으로 메트릭을 모니터링한 다음 파드에 할당된 리소스를 자동으로 업스케일함
vpa 는 k8s built-in 이 아님 
[https://github.com/kubernetes/autoscaler/blob/master/vertical-pod-autoscaler/docs/installation.md](https://github.com/kubernetes/autoscaler/blob/master/vertical-pod-autoscaler/docs/installation.md) 에 따라 설치를 진행해야 함
원리는 [https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work](https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work) 를 참고할 수 있음
**(강의에서 ****`updateMode:Auto`**** 를 보여주는데 그건 deprecated 됨.

꼭 개념 공부 시 공식문서를 살펴볼 것)**

```bash
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Recreate"  # Off, Initial, Recreate, InPlaceOrRecreate 
```

## Role Based Access Controls

## Cluster Roles

## (2025 Updates) Custom Controllers

## Layered architecture & Volume

- `/var/lib/docker` 경로에 Docker 모든 데이터가 저장되는 FS 가 마련됨
- layered architecture 를 생각해봐야 함
- 캐시에 따른 빌드 시간 및 사이징 성능 확보 가능
- 이 이미지 레이어는 Read Only, 컨테이너 생성에 대해서는 Read/Write 가능
- Volumes
- volume driver 는 Docker 볼륨을 외부 스토리지나 하드웨어와 연동해 처리하는 드라이버

### Storage Drivers

- AUFS
- ZFS
- Overlay
- Overlay2
- 등등

여러가지 존재
상황과 OS 에 적합한 Storage Drivers 를 선택하여 적용

## Volumes

앞서 설명했다싶이 Volume 은 컨테이너의 데이터를 영속화하기 위한 저장소이다.

이 개념은 k8s 까지 이어진다.

![](/images/notion/bbc2a81849ef4b38.png)

## +) [killer.sh](http://killer.sh[^40]/) and more,,,

```yaml

```

[^1]: https://velog.io/@hoonki/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4k8s-Persistent-Storage%EB%9E%80 <https://velog.io/@hoonki/%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4k8s-Persistent-Storage%EB%9E%80>
[^2]: https://kubernetes.io/docs/concepts/storage/storage-classes/ <https://kubernetes.io/docs/concepts/storage/storage-classes/>
[^3]: https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/ <https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/>
[^5]:  </images/notion/d3cdbb5e3e23ac2d.png>
[^31]:  </images/notion/d0316885ebd9da71.png>
[^40]: killer.sh <http://killer.sh/>
[^48]: https://zerojsh00.github.io/posts/CNI-Weave/ <https://zerojsh00.github.io/posts/CNI-Weave/>
[^49]: https://kubernetes.io/docs/tasks/administer-cluster/network-policy-provider/weave-network-policy/ <https://kubernetes.io/docs/tasks/administer-cluster/network-policy-provider/weave-network-policy/>
[^50]: https://ykarma1996.tistory.com/179 <https://ykarma1996.tistory.com/179>
[^51]: https://kimalarm.tistory.com/95 <https://kimalarm.tistory.com/95>
[^94]: https://uklabs.kodekloud.com/topic/mock-exam-1-4/ <https://uklabs.kodekloud.com/topic/mock-exam-1-4/>
[^150]: https://kubernetes.io/docs/concepts/workloads/pods/downward-api/ <https://kubernetes.io/docs/concepts/workloads/pods/downward-api/>
[^151]: https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/ <https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/>
[^152]: https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/ <https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/>
[^238]:  </images/notion/9c4ee8949d9c6240.png>
[^327]:  </images/notion/cb149bf77c384728.png>
[^402]:  </images/notion/3c358058810ab763.jpeg>
[^404]:  </images/notion/9baca2d758e8dbe1.png>
[^444]:  </images/notion/b2a4c40dc6ea30bd.jpeg>
[^482]: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#:~:text=Should%20you%20manually%20scale%20a%20Deployment%2C%20example%20via%20kubectl%20scale%20deployment%20deployment%20%2D%2Dreplicas%3DX%2C%20and%20then%20you%20update%20that%20Deployment%20based%20on%20a%20manifest%20(for%20example%3A%20by%20running%20kubectl%20apply%20%2Df%20deployment.yaml)%2C%20then%20applying%20that%20manifest%20overwrites%20the%20manual%20scaling%20that%20you%20previously%20did <https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#:~:text=Should%20you%20manually%20scale%20a%20Deployment%2C%20example%20via%20kubectl%20scale%20deployment%20deployment%20%2D%2Dreplicas%3DX%2C%20and%20then%20you%20update%20that%20Deployment%20based%20on%20a%20manifest%20(for%20example%3A%20by%20running%20kubectl%20apply%20%2Df%20deployment.yaml>
[^488]: https://www.baeldung.com/ops/kubernetes-deployment-vs-replicaset <https://www.baeldung.com/ops/kubernetes-deployment-vs-replicaset>
[^630]: https://learn.kodekloud.com/user/courses/udemy-labs-certified-kubernetes-administrator-with-practice-tests/module/22051647-8ef0-4f24-8551-caa14ec77d40/lesson/9589df8a-4014-4502-9881-78ad272e6913 <https://learn.kodekloud.com/user/courses/udemy-labs-certified-kubernetes-administrator-with-practice-tests/module/22051647-8ef0-4f24-8551-caa14ec77d40/lesson/9589df8a-4014-4502-9881-78ad272e6913>
[^643]: https://kubernetes.io/docs/concepts/storage/storage-classes/ <https://kubernetes.io/docs/concepts/storage/storage-classes/>
[^773]: https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/#configuration-files <https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/#configuration-files>
[^822]: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/ <https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/>
[^976]: https://uklabs.kodekloud.com/topic/mock-exam-3-3/ <https://uklabs.kodekloud.com/topic/mock-exam-3-3/>
[^1048]:  </images/notion/98593227470ad993.png>
[^1050]: PV / PVC / StorageClass <https://www.notion.so/31e19c3902908083aad7e5b1db707218#31e19c3902908097a901fc4e888b0df4>
[^1230]: 문제 1 : Node 자원 n 등분해서 Pod 생성 <https://sunrise-min.tistory.com/entry/2025-CKA-%EC%8B%9C%ED%97%98-%EC%A4%80%EB%B9%84-%ED%95%B5%EC%8B%AC-%EC%9A%94%EC%95%BD#Service_&_Network:~:text=sleep%201%3B%20done%22-,Node%20%EC%9E%90%EC%9B%90%203%EB%93%B1%EB%B6%84%ED%95%B4%EC%84%9C%20pod%20%EC%83%9D%EC%84%B1,-%EB%AC%B8%EC%A0%9C%0A%0AYou%20manage>
[^1279]: 원리 <https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/#how-does-a-verticalpodautoscaler-work>
[^1280]:  </images/notion/54f3b01a023b0f5b.svg>
