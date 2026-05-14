---
title: "RAG 란 무엇이고 어떻게 작동하는가 ? (feat. ElasticSearch)"
description: "LangChain 과 ELK 기반 따라할 수 있는 예제"
date: 2026-01-10
tags: [ai, database]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

# What?

뭘 배움?

---

---

# How?

어떻게 씀?

---

LangChain 과 ELK 기반 따라할 수 있는 예제
[https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch](https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch[^5])
[https://raeul0304.tistory.com/24](https://raeul0304.tistory.com/24[^6])
[https://www.elastic.co/search-labs/blog/elasticsearch-rag-with-llama3-opensource-and-elastic](https://www.elastic.co/search-labs/blog/elasticsearch-rag-with-llama3-opensource-and-elastic[^7])
[https://cookbook.openai.com/examples/vector_databases/elasticsearch/elasticsearch-retrieval-augmented-generation](https://cookbook.openai.com/examples/vector_databases/elasticsearch/elasticsearch-retrieval-augmented-generation[^8])

## Agentic RAG에서 반드시 딥다이브해야 할 핵심 영역

> 💡 [https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch](https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch)

## 개념

- RAG 동작원리
- 기존 RAG 와 Agentic RAG 의 차이
- Agentic RAG 의 컴포넌트들
- **LLM-as-Judge의 신뢰성 한계**
- Agent loop termination 전략
- Observability (trace, span, decision log)
- Hybrid Retrieval (Sparse + Dense + Rule)
- Tool calling vs Agent decision 분리
- Embedding drift & semantic stability
- Multi-agent 협업 vs 단일 오케스트레이터
- Self-consistency, Tree-of-Thought
- RAG 평가 프레임워크 (RAGAS, LLM Eval)
- 구현하면서 아직 해결하지 못한 문제들

## 🔍 딥다이브 포인트

> 앞으로 더 깊게 공부해야할 주제들

- Evaluation (RAGAS, LLM Eval)
- Hybrid Retrieval
- Multi-agent coordination
- Tool vs Agent boundary
- Production architecture

> 구현 시 주의해야할 체크리스트

- **모든 에이전트 판단 로그 남기기**
- retry 루프에 **강제 종료 조건**
- 사용자 쿼리 원본은 절대 변경하지 않기
- 평가 실패 이유를 구조화할 것
- “Agent가 많을수록 좋은 시스템”이라는 착각 버리기

> 에이전트의 “추론 품질”을 어떻게 통제할 것인가

- Router / Self-reflection / Rewriter 프롬프트의 **결정 경계**
- LLM이 **모호한 쿼리**에서 일관된 선택을 하는가?
- 잘못된 판단이 **연쇄 오류(cascading failure)** 로 이어지는 구조인가?
- 에이전트의 추론 품질을 어떻게 통제할 것인가

> **LLM-only 판단 ❌ → 규칙 + LLM 혼합**

- 예: `"latest" | "this year" | 날짜` 포함 → websearch 강제
- Router 결과에 **confidence score** 또는 reasoning 로그 남기기
- 동일 쿼리를 여러 번 던졌을 때 **결과 안정성 테스트**

> Self-reflection (평가 에이전트)의 한계와 개선

```bash
query + docs → binary_score (True / False)


```

이 구조는 단순하지만 **정보 손실이 큽니다**.

- 왜 실패했는지 알 수 없음
- “조금 부족” vs “완전 무관” 구분 불가
- 쿼리 재작성 방향이 무작위적이 될 수 있음

✅ 개선 방향

- Binary ❌ → **Multi-score**
- 실패 이유 구조화:

```json
{
"relevant":false,
"reason":"missing temporal context",
"suggestion":"add time constraint"
}


```

> Query Rewriting은 “자동화”보다 “통제”가 중요

쿼리 재작성은 **가장 위험한 단계**입니다.
⚠️ 위험 요소

- 원래 의도에서 점점 멀어짐 (semantic drift)
- retry가 늘수록 **hallucination 위험 증가**
- 사용자가 의도하지 않은 질문으로 바뀜

✅ 실무 권장 패턴

- rewrite는 **원본 query를 절대 버리지 말 것**

```
original_query
→ rewritten_query_v1
→ rewritten_query_v2


```

- diff 기반 rewrite: “원본을 유지하되 조건만 추가”
- retry count 외에 의미 변화율(embedding distance) 제한

> 아키텍처 & 운영 관점에서 꼭 고려해야 할 것들

에이전트 수가 늘어날수록 생기는 문제
→ “Agentic RAG는 설계는 쉽고, 운영은 어렵다”

- 주요 문제
- 권장 원칙

> 비용 & 성능 최적화 (반드시 실전에서 문제됨)

Agentic RAG는 **비싸집니다**.
✅ 반드시 체크할 항목

- 쿼리 1건당:
- 병렬 노드에서 **중복 호출 여부**
- Web search fallback 비율

💁‍♂️ 실무 팁

- Router / Self-reflection은 **소형 모델 분리**
- 동일 query + context → 결과 캐싱
- vectorstore hit 시 websearch 차단 옵션

[^2]: https://edbkorea.com/blog/postgres-%EB%B0%8F-pgvector%EA%B0%80-%ED%8F%AC%ED%95%A8%EB%90%9C-rag-%EC%95%B1/ <https://edbkorea.com/blog/postgres-%EB%B0%8F-pgvector%EA%B0%80-%ED%8F%AC%ED%95%A8%EB%90%9C-rag-%EC%95%B1/>
[^3]: https://medium.com/@levi_stringer/rag-with-pg-vector-with-sql-alchemy-d08d96bfa293 <https://medium.com/@levi_stringer/rag-with-pg-vector-with-sql-alchemy-d08d96bfa293>
[^5]: https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch <https://www.elastic.co/search-labs/kr/blog/agentic-rag-news-assistant-langchain-elasticsearch>
[^6]: https://raeul0304.tistory.com/24 <https://raeul0304.tistory.com/24>
[^7]: https://www.elastic.co/search-labs/blog/elasticsearch-rag-with-llama3-opensource-and-elastic <https://www.elastic.co/search-labs/blog/elasticsearch-rag-with-llama3-opensource-and-elastic>
[^8]: https://cookbook.openai.com/examples/vector_databases/elasticsearch/elasticsearch-retrieval-augmented-generation <https://cookbook.openai.com/examples/vector_databases/elasticsearch/elasticsearch-retrieval-augmented-generation>
[^9]: https://blog.bizspring.co.kr/%ED%85%8C%ED%81%AC/elasticsearch-%EA%B8%B0%EB%B0%98%EC%9D%98-vector-database-%EA%B5%AC%EC%84%B1/ <https://blog.bizspring.co.kr/%ED%85%8C%ED%81%AC/elasticsearch-%EA%B8%B0%EB%B0%98%EC%9D%98-vector-database-%EA%B5%AC%EC%84%B1/>
[^10]: https://vamlin.tistory.com/20 <https://vamlin.tistory.com/20>
[^11]: https://docs.spring.io/spring-ai/reference/api/chatclient.html <https://docs.spring.io/spring-ai/reference/api/chatclient.html>
[^12]: https://www.themoonlight.io/ko/review/optimizing-retrieval-augmented-generation-with-elasticsearch-for-enhanced-question-answering-systems <https://www.themoonlight.io/ko/review/optimizing-retrieval-augmented-generation-with-elasticsearch-for-enhanced-question-answering-systems>
[^14]: https://news.hada.io/topic?id=25854 <https://news.hada.io/topic?id=25854>
[^15]: https://www.youtube.com/watch?v=eiXNA9rH4Rc <https://www.youtube.com/watch?v=eiXNA9rH4Rc>
[^16]: https://www.youtube.com/watch?v=zI7rin2S_Ak <https://www.youtube.com/watch?v=zI7rin2S_Ak>
