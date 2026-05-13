---
title: "CKA - 기출 풀이 및 시험 팁"
description: "CKA 시험 기출 풀이, 팁, 참고자료 모음"
date: 2025-12-25
tags: [kubernetes]
category: uncategorized
lang: ko
draft: false
---

## CKA 에서 Custom Dotfile 사용해도 괜찮을까?

# Why ? 

---

CKA 응시할 때 nvim 설정을 조작할 수 있을까 궁금하여 찾아보았다.


# What ? 

---

1. k8s yaml 에 대한 LSP 셋업을 하면 작업할 때 수월하다
2. .vimrc 에 대해서 수정하면 편하다
3. tmux 를 미리 알아두면 좋다



# Reference

---

> CKA 시험규정 공식 가이드라인

[https://docs.linuxfoundation.org/tc-docs/certification/tips-cka-and-ckad](https://docs.linuxfoundation.org/tc-docs/certification/tips-cka-and-ckad)
[https://docs.linuxfoundation.org/tc-docs/certification/faq-cka-ckad-cks](https://docs.linuxfoundation.org/tc-docs/certification/faq-cka-ckad-cks)

> CKA Tips

[https://www.reddit.com/r/kubernetes/comments/10qvm6u/my_vim_configuration_helps_you_reduce_pain_during/?tl=ko](https://www.reddit.com/r/kubernetes/comments/10qvm6u/my_vim_configuration_helps_you_reduce_pain_during/?tl=ko)
[https://dev.to/marcoieni/ckad-2021-tips-vimrc-bashrc-and-cheatsheet-hp3#:~:text=your%20current%20shell.-,.vimrc,-At%20the%20beginning](https://dev.to/marcoieni/ckad-2021-tips-vimrc-bashrc-and-cheatsheet-hp3#:~:text=your%20current%20shell.-,.vimrc,-At%20the%20beginning)

## CKA 연습 참고자료

# Why ? 

---

CKA 연습문제


# What ? 

---

- **killer.sh **
- **killer.coda **
- sailor.sh
- **GitHub CKA-Exercises**

> 💡 우선순위

# Reference

---

## CKA 총 정리 & 치트시트

# Rubber Duck 

```java
너는 지금부터 나의 CKA(Certified Kubernetes Administrator) 시험 합격을 돕는 깐깐한 쿠버네티스 튜터야.

시험까지 남은 기간을 고려해서, 첨부한 치트시트 PDF 를 기반으로 실제 CKA 시험에서 주로 출제되는 도메인과 가중치를 기반으로 나를 가르쳐줘.

---

📌 CKA 시험 도메인 (2024 기준):
- Cluster Architecture, Installation & Configuration (25%)
- Workloads & Scheduling (15%)
- Services & Networking (20%)
- Storage (10%)
- Troubleshooting (30%)

---

🦆 학습 방식 (Rubber Duck Debugging):

1. 너는 나에게 특정 쿠버네티스 개념을 제시할 거야.

2. 나는 그 개념을 내 말로 설명할 거야.
   너는 내 설명을 듣고, 생략된 핵심 키워드, 틀린 동작 원리, 잘못된 kubectl 명령어 등을 아주 날카롭게 지적해줘.

3. 내 설명이 완벽해지면, 해당 개념과 관련된 **실제 CKA 시험 수준의 실전 문제**를 하나 내줘.
   - 문제는 반드시 `kubectl` 명령어 또는 YAML 작성이 필요한 핸즈온 형식으로 출제해줘.
   - 제약 조건(네임스페이스, 리소스명, 포트 등)을 명확히 명시해줘.

4. 나는 그 문제의 풀이 과정(명령어 or YAML)을 너에게 설명할 거야.
   너는 내 풀이의 허점(오타, 누락된 필드, 비효율적인 접근법)을 찾아서 지적해줘.

5. 풀이가 완성되면, 해당 개념을 실전에서 빠르게 적용하는 **핵심 치트키(명령어 or 패턴)**를 정리해줘.

---

🚫 금기 사항:

- 정답(완성된 YAML 또는 전체 명령어)을 바로 알려주지 마.
  내가 스스로 생각할 수 있도록 힌트와 참고할 공식 문서 경로만 먼저 줘. (예: `kubernetes.io/docs/concepts/...`)

- 어떤 개념을 참고하고 어떤 방식으로 접근해야 하는지를 항상 함께 알려줘.

- 내가 틀렸을 때 그냥 넘어가지 마. 왜 틀렸는지 원리부터 짚어줘.

---

준비됐으면, 시작하자:
```



# ⚙️ 설치 & 환경구성

## 1회 기출 풀이

# 1 ✅

```
# configmap 가져오기
kubectl get configmap nginx-config -n nginx-static -o yaml > nginx-config.yaml

# TLS 활성화
vi nginx-config.yaml
TLSv1.3 -> TLSv1.2 로 변경 혹은 추가

# configmap 업데이트
kubectl apply -f nginx-config.yaml

# deployment 재시작
kubectl rollout restart deploy nginx-static -n nginx-static
kubectl rollout status deploy nginx-static -n nginx-static

# 최종 확인
kubectl describe deploy nginx-static -n nginx-static
curl -k --tls-max 1.2 <https://web.k8s.local:30007>
```

이미 존재하는 configmap 에 대해서는 apply 보다는 patch/replace 가 더 안전

# 2 ✅

```
vi apache-server-hpa.yaml

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: apache-server
  namespace: autoscale
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: apache-server
  minReplicas: 1
  maxReplicas: 4
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 30

kubectl apply -f apache-server-hpa.yaml

kubectl get hpa apache-server -n autoscale

kubectl describe hpa apache-server -n autoscale
```

hpa 이름을 잘못 적음, 문제는 `apache-server`인데 답안은 `apache-server-hpa`로 지정
최종 확인 시 deploy 가 아니라 HPA 리소스를 확인해야 함 (watch 는 본인이 쓰고싶은대로 사용)
HPA 에도 namespcae 적용해야함. 어떤 k8s 리소스가 namespace bound 인지 non namespace bound 인지 구분을 못 하는 것 같음, 정리 요망

# 3 ✅

```bash
# 1. 기존 PV 확인 (Retain 정책이라 Released 상태일 것)
kubectl get pv

# 2. PV의 claimRef 초기화 (Released → Available로 만들기)
kubectl patch pv ${pv-name} --type=json \\
  -p='[{"op":"remove","path":"/spec/claimRef"}]'

# 3 PVC 생성
vi mariadb-pvc.yaml

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mariadb
  namespace: mariadb
spec:
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 250Mi

# 4 Deploy 가 생성한  PVC 사용하도록 수정
kubectl get deploy mariadb-deploy -n mariadb
vi ~/mariadb-deploy.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: mariadb-deploy
  ,,,
spec:
  ,,,
  template:
    spec:
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: mariadb
      containers:
          ,,,,

# 5 PVC 적용 후 PVC 확인
kubectl apply -f ~/mariadb-pvc.yaml

kubectl get pvc -n mariadb

# 6 Deploy 적용 후 확인
kubectl apply -f ~/mariadb-deploy.yaml

kubectl get deploy mariadb-deploy -n mariadb

kubectl rollout status deploy mariadb-deploy -n mariadb
```

**PVC 이름이 틀림** → 문제는 `mariadb`인데 답안은 `mariadb-pvc`
**PV가 Retain 상태**이므로, 기존 PV를 재사용하려면 PV의 `claimRef`를 먼저 초기화해야 바인딩 가능 → 이 과정을 완전히 놓침

# 4 ✅

```
kubectl get storageclass
만약 StorageClass 가 있고 default 설정이 되어있다면 default 설정 어노테이션 제거

vi low-latency.yaml

apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: low-latency
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: rancher.io/local-path
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer

kubectl apply -f low-latency.yaml

kubectl get storageclass low-latency
```

**기존 default StorageClass가 있다면 반드시 기존 것의 default 어노테이션을 제거**해야 함 → 하지 않으면 default가 2개가 되어 동작 불안정
`reclaimPolicy`, `parameters.guaranteedReadWriteLatency` 등 문제에서 명시하지 않은 항목은 추가하지 않는 게 안전

# 5 ✅

**Gateway spec 구조가 틀림** → `tls`는 `listeners` 하위 항목이며 HTTP listener에는 tls 블록이 없음. TLS는 `protocol: HTTPS` 또는 `protocol: TLS`일 때만 사용

```
kubectl get ingress web -o yaml > web-ingress.yaml

해당 인그레스 yaml 에서 시크릿이름 확인

vi nginx-gateway.yaml

apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: nginx-gateway
  namespace: <ingress와 같은 namespace>
spec:
  gatewayClassName: nginx
# 올바른 구조 - 모두 listener 하위에 들여쓰기
listeners:
- name: https
  protocol: HTTPS
  port: 443
  hostname: "gateway.web.k8s.local"  # ← listener 직속
  tls:                                # ← listener 직속
    mode: Terminate                   # ← tls 하위
    certificateRefs:                  # ← tls 하위
    - kind: Secret
      group: ""
      name: <secret명>
  allowedRoutes:                      # ← listener 직속
    namespaces:
      from: Same
--
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
  namespace: &lt;같은 namespace&gt;
spec:
  parentRefs:                    # ← 필수! Gateway 연결
  - name: web-gateway
  hostnames:
  - "gateway.web.k8s.local"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: <ingress에서 확인한 서비스>
      port: <포트>

kubectl apply -f nginx-gateway.yaml

kubectl get gateway nginx-gateway

curl -k <https://gateway.web.k8s.local>

kubectl delete ingress web
```

`hostname`은 listener 하위가 아닌 올바른 위치에 있어야 함
HTTP 가 아니라 HTTPS
따라서 port 도 80 이 아니라 443 으로 처리
HttopRoute 에서 parentRefs 와 parentRefs.hostnames, parentRefs.rules 에 대해서 선언해줘야 Gateway 와 매핑됨
**마지막에 기존 Ingress 삭제**를 놓침

# 6 ✅

```
vi echo-ingress.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo
  namespace: echo-sound
spec:
  rules:
  - host: example.org            # ← 반드시 host 명시
    http:
      paths:
      - path: /echo
        pathType: Prefix
        backend:
          service:
            name: echoserver-service
            port:
              number: 8080

kubectl apply -f echo-ingress.yaml

kubectl get ingress echo -n echo-sound

kubectl get endpoints echoserver-service -n echo-sound

curl -o /dev/null -s -w "%{http_code}\\n" <http://example.org/echo>
```

`host: example.org` 필드가 빠져 있음 → host 없으면 도메인 기반 라우팅 안 됨
최종 확인에서 `kubectl endpoints`는 잘못된 명령 → `kubectl get endpoints`

# 7 ✅

NetworkPolicy 원리 이해를 못 함, 다시 공부할 것
restrictive NetworkPolicy 에 대해서도 다시 공부할 것
`~/netpol` 폴더에 여러 NetworkPolicy YAML이 이미 있음
직접 작성하는 게 아니라 **폴더에서 가장 restrictive한 것을 골라서 apply**하는 문제

```bash
# 1. frontend/backend deployment 확인 (label, port 파악)
kubectl get deploy -n frontend -o yaml
kubectl get deploy -n backend -o yaml
kubectl get pods -n frontend --show-labels
kubectl get pods -n backend --show-labels

# 2. 기존 deny-all netpol 확인
kubectl get networkpolicy -n frontend
kubectl get networkpolicy -n backend

# 3. ~/netpol 폴더의 파일 목록 확인
ls ~/netpol/
cat ~/netpol/*.yaml   # 각 파일 내용 확인

# 4. 가장 restrictive한 것 선택하여 apply
# (frontend→backend 통신만 허용하고 나머지는 최소화된 것)
kubectl apply -f ~/netpol/&lt;선택한파일&gt;.yaml

# 5. 확인
kubectl get networkpolicy -n backend
kubectl get networkpolicy -n frontend
```

# 8 ✅

label 실수, deployment의 pod label과 일치해야 함
NodePort 잘못 지정함, 범위는 30000~32767. 번호 미지정 시 자동 할당, 여기서는 아예 자동할당 맡기는 게 나음

```bash
kubectl edit deploy front-end -n sp-culator

apiVersion: apps/v1
kind: Deployment
metadata:
  name: front-end
  namespace: sp-culator
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: front-end
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80

kubectl create service front-end-svc --port=80 --type=nodeport -n sp-culator

apiVersion: v1
kind: Service
metadata:
  name: front-end-svc
  namespace: sp-culator
spec:
  type: NodePort
  selector:
    app: front-end
  ports:
    - port: 80
      targetPort: 80

kubectl get svc front-end-svc -n sp-culator

kubectl get endpoints front-end-svc -n sp-culator
```


[CKA 치트시트](http://sunrise-min.tistory.com/entry/2025-CKA-%EC%8B%9C%ED%97%98-%EC%A4%80%EB%B9%84-%ED%95%B5%EC%8B%AC-%EC%9A%94%EC%95%BD#Service_&_Network)
[CKS 치트시트](https://devops-james.tistory.com/233)
첫 시험 -  [https://trainingportal.linuxfoundation.org/learn/course/certified-kubernetes-administrator-cka/exam/exam](https://trainingportal.linuxfoundation.org/learn/course/certified-kubernetes-administrator-cka/exam/exam) 
[CKA 문제 & 정답 - CKA 카페](https://cafe.naver.com/f-e/cafes/30725715/menus/64?viewType=L)
[인프런 CKA - ID : mypoohmy@gmail.com PW : cka1234!](https://www.inflearn.com/course/certified-kubernetes/dashboard?cid=339687)
