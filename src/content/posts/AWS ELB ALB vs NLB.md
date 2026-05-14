---
description: '우리 팀은 다량의 트래픽에 따른 Scale-Out 을 지원하기 위해 Load Balancer 를 도입하기로 하였다.Load Balancer 의 L 짜도 모르던 초짜에게 LB 의 개념과 더불어 "왜 어떤 LB를 선택했는지" 를 결정짓기가 어려웠다.다음 과정을 통해 의사결'
date: 2024-02-12
tags: [journal]
lang: ko
draft: false
---

# Intro :: 상황에 맞는 Load Balancer 선택하기

우리 팀은 다량의 트래픽에 따른 Scale-Out 을 지원하기 위해 Load Balancer 를 도입하기로 하였다.

Load Balancer 의 L 짜도 모르던 초짜에게 LB 의 개념과 더불어 "왜 어떤 LB를 선택했는지" 를 결정짓기가 어려웠다.

다음 과정을 통해 의사결정을 하게 되었다.

# ALB vs NLB

AWS 에서 제공하는 [ALB 와 NLB 의 기능차이 테이블](https://aws.amazon.com/elasticloadbalancing/features/)은 아래와 같다.

| 기능                   | Application Load Balancer | Network Load Balancer                   | Gateway Load Balancer                  | Classic Load Balancer     |
| ---------------------- | ------------------------- | --------------------------------------- | -------------------------------------- | ------------------------- |
| 로드 밸런서 유형       | 계층 7                    | 계층 4                                  | 계층 3 게이트웨이 + 계층 4 로드 밸런싱 |                           |
| 대상 유형              | IP, 인스턴스, Lambda      | IP, 인스턴스, Application Load Balancer | IP, 인스턴스                           |                           |
| 흐름/프록시 동작 종료  | 예                        | 예                                      | 아니요                                 | 예                        |
| 프로토콜 리스너        | HTTP, HTTPS, gRPC         | TCP, UDP, TLS                           | IP                                     | TCP, SSL/TLS, HTTP, HTTPS |
| 다음을 통해 연결 가능  | VIP                       | VIP                                     | 라우팅 테이블 항목                     |                           |
| 리디렉션               | ✔                         |                                         |                                        |                           |
| 고정 응답              | ✔                         |                                         |                                        |                           |
| Desync Mitigation Mode | ✔                         |                                         |                                        |                           |
| HTTP 헤더 기반 라우팅  | ✔                         |                                         |                                        |                           |
| HTTP2/gRPC             | ✔                         |                                         |                                        |                           |

## ALB

- OSI 7 Layer중에서 애플리케이션 레이어에서 로드밸런싱 동작

- HTTP/HTTPS 프로토콜의 URL의 PATH 기반으로 전송할 타겟을 지정 가능

- ALB는 **IP주소 + 포트번호 + 패킷 내용을** 보고 스위칭
  - 인스턴스에 대한 연결이 로드 밸런서에서 설정되므로 웹 서버 액세스 로그에는 로드 밸런서의 IP 주소가 캡처
  - 이를 위해 X-Forwarded-For 헤더를 사용
    ![](/images/velog/29d7e388cb2292d1.png)
    https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/x-forwarded-headers.html

- ALB는 IP 주소가 변동되기 때문에 Client에서 Access 할 ELB의 DNS Name을 이용

- ALB는 L7단을 지원하기 때문에 SSL 적용이 **가능**

- NLB보다 성능적으로는 느릴수는 있어도 요청에 따른 패킷에 따라 다양한 전송 규칙을 지정 가능

## NLB

- OSI 7 Layer중에서 전송계층 레이어에서 로드밸런싱 동작

- TCP/UDP 프로토콜 기반으로 전송할 타겟을 지정 가능

- NLB는 **IP + 포트번호**를 보고 스위칭

- NLB는 할당한 **Elastic IP를 Static IP로 사용이 가능하여 DNS Name과 IP주소 모두 사용이 가능**
  - 인바운드 트래픽에 대한 정적 IP가 필요하다면 NLB는 좋은 옵션이다!

- 아래 그림과 같이 Instance ID 혹은 IP 를 통해 통신할 수 있다.

차이점은 LB를 거쳐서 응답하냐의 유무

![](/images/velog/d2801294254dc74d.png)

![](/images/velog/db0f62553c07d0ee.png)

- NLB는 SSL 적용이 인프라 단에서 **불가능**하여 애플리케이션에서 따로 적용

- 고성능을 요구하는 환경에서의 부하분산에 적합하며, 낮은 레이턴시로 초당 수백만 건의 요청을 처리 가능

### ALB 와 NLB 속도 차이

ALB는 레이어 7에서 작동하며, 이는 수신되는 모든 HTTP 요청의 세부 정보를 검사한다.

이와 대조적으로 NLB는 레이어 4에서 작동한다.

NLB는 들어오는 TCP 또는 UDP 연결을 대상으로 전달하는 데만 신경을 쓴다.

예를 들어, NLB는 들어오는 HTTP 요청을 검사하지 않는다.

따라서 NLB는 ALB보다 해야 할 일이 훨씬 적다.

결과적으로 NLB는 들어오는 요청을 전달하는 데 훨씬 적은 시간이 필요하다.

따라서 아래 사항에 해당한다면 NLB를 고려하자.

- 성능이 워크로드에 매우 중요한 경우

- 단순한 라우팅이 필요하고, 트래픽이 극도로 많은 경우

### 아래 체크리스트 중 "예"가 대다수라면 NLB를 고르자

✅ 클라이언트와 UDP / Non-Http 로 통신하는가?

✅ 최대한 성능을 최적화 해야하는가?

✅ 예측치 못 한 트래픽 스파크 시나리오가 고려되는가?

✅ (방화벽 옵션을 위한) 인바운드 트래픽에 대한 정적 IP가 필요한가?

# 그래서 무엇을 선택할 것인가?

아래 사항을 위해서 ALB 를 선택하는 게 낫다고 판단되었다.

- HTTP 리스너
- SSL 적용
- MAX 타겟이 1000-5000 로 유연
- 동일 연결에 대한 병렬 요청/응답 지원, 즉 멀티플렉싱 지원

만약 거대한 트래픽 스파이크나, 더욱 빠른 라우팅을 해야하는 경우라면, NLB로 튜닝하여 성능개선을 하면 좋겠다고 생각한다.

다만, 대부분의 블로그에서 볼 수 있었듯이, 선착순 시스템이 아닌 이상, 그럴 일은 드물 거 같다.

# Reference

[ALB vs.

NLB: Which AWS load balancer fits your needs?](https://blog.cloudcraft.co/alb-vs-nlb-which-aws-load-balancer-fits-your-needs/)

[Nlb vs alb for ecs](https://www.reddit.com/r/aws/comments/15t90kr/nlb_vs_alb_for_ecs/)

[ALB, NLB,ELB 차이는?](https://incheol-jung.gitbook.io/docs/q-and-a/infra/alb-nlb-elb)

[AWS ALB와 NLB 차이점](https://no-easy-dev.tistory.com/entry/AWS-ALB%EC%99%80-NLB-%EC%B0%A8%EC%9D%B4%EC%A0%90)

[Network Traffic Distribution – Elastic Load Balancing – Amazon Web Services](https://aws.amazon.com/elasticloadbalancing/features/)
