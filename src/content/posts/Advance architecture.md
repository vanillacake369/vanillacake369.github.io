---
title: "Advance architecture"
description: "하나의 프로젝트가 장기화 되면 될수록 유지보수는 커녕 점점 더러워지는 코드베이스에 신물이 나기 시작했다."
date: 2025-05-12
tags: [system-design]
category: uncategorized
lang: ko
draft: false
---

# Background

---

하나의 프로젝트가 장기화 되면 될수록 유지보수는 커녕 점점 더러워지는 코드베이스에 신물이 나기 시작했다.
이를 해결하기 위해서는 항상 외부 요인을 찾곤했었는데 — EDA 라던지, 모듈구조 등등 — 
진정한 해결책은 그게 아닌 내부의 복합적인 문제였다.
어떤 문제들이 있는지 살펴보고, 어떻게 해결할 수 있는지 정리해보고자 한다.


# 무엇이 문제인가?

---

**1. 흩어진 도메인 로직**

- **문제**: 도메인 로직이 v1·v2로 나뉘어 여기저기 퍼져 있음
- **원인**: 도메인 클래스와 DAO 클래스를 똑같이 사용해서 구분이 안 됨
- **해결**:

**2. 낮은 인프라 유연성**

- **문제**: 외부 인프라(예: DB, 메시지 큐 등)를 바꾸기 어려움
- **원인**: 인프라 코드가 도메인 코드에 단단히 붙어 있음
- **해결**:

**3. 정책 수정에 따른 코드 수정**

- **문제**: 기획(정책) 바뀔 때마다 도메인 로직이 여기저기 흩어져 있어 손이 많이 감
- **원인**: 서비스 레이어가 실제 도메인 로직을 직접 처리
- **해결**:

**4. 로직 구현 위치 판단 어려움**

- **문제**: 어떤 도메인에 어떤 로직을 넣어야 할지 모호
- **원인**: 도메인 경계가 불명확
- **해결**:

**5. 지켜지지 않는 컨벤션**

- **문제**: 코드 컨벤션 문서를 만들어도 실제 코드가 다르게 작성됨
- **원인**:
- **해결**:

**6. 확장하기 어려운 도메인 코드**

- **문제**:
- **원인**: 빈약한 도메인 모델에 과도한 응용 레이어 집중
- **해결**:



# 해결방안 💡

---

## 논리적 구조 (방법론)








# Further work

---

> 💡 위 구조에 대해 규칙을 강제화하는 방안들이다.

- 도메인 모임 형성, 도메인 영역 규정
- 도메인 모임 간 대화
- 도메인 쿼리는 도메인 안에



# Show me the code ⌨️

---

## 도메인 단위 패키지

[https://github.com/vanillacake369/otlp-demo/tree/divide-per-domain](https://github.com/vanillacake369/otlp-demo/tree/divide-per-domain)

## 기능 단위 패키지

[https://github.com/vanillacake369/otlp-demo/tree/divide-per-usecase](https://github.com/vanillacake369/otlp-demo/tree/divide-per-usecase)

# Reference

---

[https://medium.com/@inzuael/anemic-domain-model-vs-rich-domain-model-78752b46098f](https://medium.com/@inzuael/anemic-domain-model-vs-rich-domain-model-78752b46098f)
[https://www.cnblogs.com/aspiration2016/articles/13306649.html](https://www.cnblogs.com/aspiration2016/articles/13306649.html)
[http://querydsl.com/static/querydsl/3.2.2/reference/html/ch03s03.html#:~:text=3.3.4.%C2%A0Delegate%20methods](http://querydsl.com/static/querydsl/3.2.2/reference/html/ch03s03.html#:~:text=3.3.4.%C2%A0Delegate%20methods)
[https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture?utm_source=chatgpt.com](https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture?utm_source=chatgpt.com)
[https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/?utm_source=chatgpt.com](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/?utm_source=chatgpt.com)
[https://lannex.github.io/blog/2022/ddd-hexagonal-onion-clean-cqrs/](https://lannex.github.io/blog/2022/ddd-hexagonal-onion-clean-cqrs/)
[https://github.com/hgraca/explicit-architecture-php/tree/master](https://github.com/hgraca/explicit-architecture-php/tree/master)
[https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/#:~:text=A%20repository%20will%20save(),of%20the%20complex%20persistence%20code](https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/#:~:text=A%20repository%20will%20save(),of%20the%20complex%20persistence%20code)
[https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture](https://vaadin.com/blog/ddd-part-3-domain-driven-design-and-the-hexagonal-architecture)
