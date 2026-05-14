---
title: "Unit & Integration Testing(feat.Junit5)"
description: "기준없이 유닛 테스트와 통합 테스트를 짜던 시절을 버리고 싶다."
date: 2026-02-25
tags: [java]
lang: ko
draft: true
---

# Why(What For?) 🤷‍♂️


기준없이 유닛 테스트와 통합 테스트를 짜던 시절을 버리고 싶다.

해당 내용을 정리하면서 아래 내용에 대한 나만의 기준을 가져보자.
~~가져보는 시간을 가져보도록 하는 시간을 가져보도록 하는 것을 가져보도록 하자~~

- [ ] SpringBootTest와 WebMvcTest 사용 기준은 어떻게 될까?
- [ ] MockMvc의 목적은 뭘까?
- [ ] Stub와 그에 따른 MockBean 주입은 언제 하고, 어떻게 할까?
- [ ] private 메소드들은 어떻게 테스트 할까?
- [ ] (다른 서비스에 대한) 선행 메소드가 필요한 테스트는 어떻게 처리해야할까?
⇒ (회원생성 이후 로그인 검증)

# What(What should I know?) 👇


> 길게 주절주절 정리할 필요가 없이, 아래 두 포스트를 잘 살펴보면, 이제 단위,통합 테스트를 어떻게 구성해야할지 막막했던 걸 좀 털어낼 수 있을 것 같다.

# How(How to apply to code?) ✍️
