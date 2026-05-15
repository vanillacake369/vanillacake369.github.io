---
description: "서비스가 예상 트래픽을 버틸 수 있는지, 장애 임계는 어디인지, 장시간 운영에도 메모리가 새지 않는지 — k6 로 Smoke·Load·Stress·Spike·Breakpoint·Soak 테스트를 직접 구현하며 각 기법의 목적과 옵션 활용법을 정리한다."
date: 2025-06-03
tags: [journal]
lang: ko
draft: false
---

# Why?

중요한 로직에 대해 처리량 및 정상 수행 여부를 확인하려면 e2e 테스트 혹은 통합 테스트가 필요하다. 성능 저하 로직들은 시스템을 멈출 수 있고, 대규모 트래픽 서비스인지 여부를 떠나서 이러한 점들을 위해 테스트가 필요하다.

더불어 사내에서 정부 과제를 위한 성능 지표로 부하 테스트 및 스모크 테스트 결과를 요구하고 있다. 이를 위해 대표적인 테스트 기법 여섯 가지와 k6 사용법에 대해 간략히 소개하고자 한다.

# 테스트 종류 🗂️

> 대부분의 테스트 기법들이 영문 명칭인데, 일부러 번역하지 않았다. 용어 자체를 바꾸면 독자가 헷갈리기도 하고, 다른 개발자들 간의 소통이 어려워지기 때문이다. 용어의 의미는 직관적이니 영문 그대로 따라가자.

## Smoke Testing — 기준선을 먼저 세운다 🔥

**목표**

- 애플리케이션의 기본 기능 검증 — 1명의 가상 사용자로 최소 요청을 실행하여 기능이 정상 작동하는지 확인한다.
- 스모크 테스트 결과는 이후 모든 테스트의 **기준점(baseline)** 으로 활용된다. 예를 들어 "스모크 실행 시간 vs Load Test 1000명 실행 시간" 비교가 여기에 해당한다.[^1]

**테스트 방법**

- 최소한의 요청을 통해 기능을 수행하고 결과값을 저장한다.
  - 1명의 가상 사용자(VU)
  - 최소한의 요청 값
  - 최소한의 요청 시간

## Load Testing — 예상 트래픽을 견딜 수 있는가 📈

![LoadTest.png](/images/velog/48c9d2d1ef94f15c.png)

**목표**

- 예상되는 시스템 부하를 검증한다. API에 1000명의 사용자가 접근할 것으로 예상된다면, 1000명을 기준으로 테스트를 수행한다.[^2]
- 최소한의 성능이 항상 기대치만큼 나오는지 확인한다.
- 스모크 테스트 결과를 기준점으로 삼아 시스템 제한 사항 및 개선 사항을 분석한다.

**테스트 방법**

- N명의 사용자에 대해 행동을 시뮬레이션하여 호출한다.
- 부하를 점진적으로 늘렸다가 줄이는 단계를 거친다.
  - **램프업(ramp-up) 단계** — 부하를 점진적으로 늘리는 단계 (운동으로 비유하면 점진적 과부하)
  - **램프다운(ramp-down) 단계** — 부하를 점진적으로 줄이는 단계 (운동으로 비유하면 드롭세트)
- 이러한 과정을 통해 시스템 리소스를 얼마나 조정할 것인지를 분석한다(System Elasticity).

## Stress Test — 기대치를 넘어서면 무슨 일이 생기는가 💥

![](/images/velog/8042989141c9ebcd.png)

**목표**

- 예상 요청 기대치보다 일부러 더 많은 부하를 걸어보는 테스트다. Load Test는 기대되는 사용자의 수만큼 테스트하지만, Stress Test는 그 기대치보다 더 걸어본다.[^3]

**테스트 방법**

- Load Test와 방법은 동일하다.
- 램프업과 램프다운 단계는 그대로 유지하되, 목표 VU 수(target)를 기대치 이상으로 늘린다.

## Spike Test — 순간적인 폭증을 버티는가 ⚡

![SpikeTest.png](/images/velog/b6f58875ab480410.png)

**목표**

- 순간적으로 부하가 폭증하는 상황을 테스트한다.
- 이를 통해 시스템의 스케일 업/스케일 다운 동작을 관찰할 수 있다.[^4]

**테스트 방법**

- 부하 증감 속도를 동일하게 유지하면서 순간적인 부하 급증을 시뮬레이션한다.

## Breakpoint Test — 장애 임계를 찾아낸다 🔍

**목표**

- 장애 발생 지점(BreakPoint)을 체크하는 테스트다.
- 시스템에 장애가 날 때까지 부하를 계속 부어본다.[^5]

**테스트 방법**

- 장애를 일으키기 직전까지 점진적으로 트래픽 부하를 높인다.
- 시스템의 장애 지점(breaking point)을 식별한다.

## Soak Test — 장시간 운영에서 리소스가 새는가 🧪

![](/images/velog/f34e9ab996ffc23f.png)

**목표**

- 장시간 일정한 부하를 지속적으로 걸었을 때 시스템이 어떻게 동작하는지 확인한다.
- 메모리 누수, 메모리·디스크·데이터베이스 등의 리소스 고갈 시 시스템이 어떻게 반응하는지 식별한다.[^6]

**테스트 방법**

- 수 시간~수 일에 걸쳐 일정한 수준의 트래픽을 부하한다.
- CPU·메모리 사용량, 디스크 I/O, DB 연결 상태 등을 지속적으로 모니터링한다.
- 장기 운영 후 메모리 누수(leak), 커넥션 풀 고갈(conn pool exhaustion), 디스크 공간 부족(disk full) 등이 발생하는지 확인한다.

# k6 기본 활용법 🛠️

## k6 란 무엇인가 📦

- Grafana Labs에서 관리하는 오픈 소스 부하 테스트 툴이다.[^7]
- Go로 작성되었으며 내부적으로 JS 엔진(Goja)을 활용한다.
- 부하 테스트 스크립트를 JS로 구성할 수 있다.
- 옵션을 통해 시나리오 및 테스트 시간을 지정할 수 있다.

가장 기본적인 호출 방법을 알아보고, 이후 옵션 활용법을 살펴본다. 테스트 대상을 만들기 위해 아래와 같이 카운팅 Go 모듈을 작성해보았다.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

var count int = 0

func main() {
	/** POST : Increase count */
	http.HandleFunc("/count", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			var previousCount = count
			count++
			fmt.Fprintf(w, "Previous count : %d -> Current count : %d\n", previousCount, count)
			return
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	/** PUT : Update count by input value */
	http.HandleFunc("/count/update", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			var countUpdate struct {
				Value *int `json:"value"`
			}
			err := json.NewDecoder(r.Body).Decode(&countUpdate)
			if err != nil {
				http.Error(w, "Invalid request body"+err.Error(), http.StatusBadRequest)
			}
			count = *countUpdate.Value
			fmt.Fprintln(w, "Count has updated as : "+strconv.Itoa(count))
			return
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
```

실제로 curl을 통해 제대로 작동하는지 확인해보았다.

```bash
# POST : count 증가
curl -X POST localhost:8080/count
# PUT : count 값 수정
curl -d '{"value":32}' -X PUT -H "Content-Type: application/json" http://localhost:8080/count/update
```

![](/images/velog/48ae268fcc2045b5.gif)

이후 k6를 통해 아래와 같이 호출할 수 있다.[^8]

```js
import http from "k6/http";
import { sleep } from "k6";

const domain = "localhost";
const port = "8080";
const postUrl = `http://${domain}:${port}/count`;
const putUrl = `http://${domain}:${port}/count/update`;

export default function () {
  // POST : count 증가
  let postData = {};
  let resPost = http.post(postUrl, JSON.stringify(postData), {
    headers: { "Content-Type": "application/json" },
  });
  console.log(
    `POST /count → status ${resPost.status}, body: ${resPost.body.trim()}`,
  );

  // PUT : count 값 수정
  const putData = { value: 42 };
  let resPut = http.put(putUrl, JSON.stringify(putData), {
    headers: { "Content-Type": "application/json" },
  });
  console.log(
    `PUT /count/update → status ${resPut.status}, body: ${resPut.body.trim()}`,
  );

  sleep(1);
}
```

![](/images/velog/77c87d25816a5b21.gif)

다른 HTTP method에 대해 호출하고자 한다면 아래 예제들을 참고한다.

- [**GET**](https://grafana.com/docs/k6/latest/javascript-api/k6-http/get/)
  ```js
  import http from "k6/http";
  import { sleep } from "k6";

  export default function () {
    http.get("https://test.k6.io");
    sleep(1);
  }
  ```
- [**POST**](https://grafana.com/docs/k6/latest/javascript-api/k6-http/post/)
  ```js
  import http from "k6/http";

  const url = "https://quickpizza.grafana.com/api/json";
  const logoBin = open("./logo.png", "b");

  export default function () {
    let data = { name: "Bert" };

    // JSON 문자열을 body로 전송
    let res = http.post(url, JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
    console.log(res.json().json.name); // Bert

    // 객체를 body로 전달하면 Content-Type: application/x-www-form-urlencoded 가 자동 설정됨
    res = http.post(url, data);
    console.log(res.json().form.name); // Bert

    // 바이너리 배열을 body로 전송 — open() 시 'b' 인수 필요
    http.post(url, logoBin, { headers: { "Content-Type": "image/png" } });

    // ArrayBuffer를 body로 전달 — TypedArray 뷰가 아닌 ArrayBuffer 인스턴스를 넘겨야 함
    data = new Uint8Array([104, 101, 108, 108, 111]);
    http.post(url, data.buffer, { headers: { "Content-Type": "image/png" } });
  }
  ```
- [**DELETE**](https://grafana.com/docs/k6/latest/javascript-api/k6-http/del/)
  ```js
  import http from "k6/http";

  const url = "https://quickpizza.grafana.com/api/delete";

  export default function () {
    const params = { headers: { "X-MyHeader": "k6test" } };
    http.del(url, null, params);
  }
  ```
- [**PUT**](https://grafana.com/docs/k6/latest/javascript-api/k6-http/put/)
  ```js
  import http from "k6/http";

  const url = "https://quickpizza.grafana.com/api/put";

  export default function () {
    const headers = { "Content-Type": "application/json" };
    const data = { name: "Bert" };

    const res = http.put(url, JSON.stringify(data), { headers: headers });

    console.log(JSON.parse(res.body).name);
  }
  ```
- [**PATCH**](https://grafana.com/docs/k6/latest/javascript-api/k6-http/patch/)
  ```js
  import http from "k6/http";

  const url = "https://quickpizza.grafana.com/api/patch";

  export default function () {
    const headers = { "Content-Type": "application/json" };
    const data = { name: "Bert" };

    const res = http.patch(url, JSON.stringify(data), { headers: headers });

    console.log(JSON.parse(res.body).name);
  }
  ```

## k6 옵션 활용법 ⚙️

k6는 옵션을 지정하여 테스트 구성 방식을 제어할 수 있다. 대표적인 설정은 아래와 같고, 부가적인 설정은 [k6 options reference](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/)를 참고한다.[^9]

- [**vus**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#vus) — 동시에 실행할 가상 사용자(VU) 수를 지정한다. `iterations` 또는 `duration`과 함께 사용한다. 세밀한 제어가 필요하다면 [`stages`](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#stages) 또는 [scenarios](https://grafana.com/docs/k6/latest/using-k6/scenarios/)를 활용한다.
  ```js
  export const options = {
    vus: 10,
    duration: '1h',
  };
  ```

- [**iterations**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#iterations) — 테스트 실행에서 기본 함수의 총 반복 횟수를 지정한다. 이 횟수는 각 VU별 횟수가 아니라 전체 합산 횟수이며, VU들이 공유하여 나눠서 실행하는 shared iteration 방식이다. 빠르게 끝나는 VU가 더 많은 횟수를 실행할 수 있다. 각 VU별 반복 횟수를 동일하게 가져가려면 [per-vu iterations executor](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/per-vu-iterations/)를 지정한다.
  ```js
  // 5명의 가상 사용자가 총 10번의 호출을 나눠서 처리
  export const options = {
    vus: 5,
    iterations: 10,
  };
  ```

- [**duration**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#duration) — 테스트가 실행될 총 기간을 지정한다.
  ```js
  export const options = {
    vus: 100,
    duration: "3m",
  };
  ```

- [**stages**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#stages) — 테스트 부하가 주입되는 단계를 설정한다. 일반적으로 RampUp → Load(Flat) → RampBackDown 순서로 수행된다.
  ```js
  export const options = {
    stages: [
      // RampUp : 0 → 10 VU for 3m
      { duration: "3m", target: 10 },
      // Flat : 10 VU for 5m
      { duration: "5m", target: 10 },
      // RampDown : 10 → 0 VU for 3m
      { duration: "3m", target: 0 },
    ],
  };
  ```

- [**maxRedirects**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#max-redirects) — 요청을 포기하고 오류를 발생시키기 전에 k6가 따를 최대 HTTP 리디렉션 횟수다.
  ```js
  export const options = {
    maxRedirects: 10,
  };
  ```

- [**scenarios**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#scenarios) — 유스케이스에 맞는 실행 환경을 조정한다. Executor, VU, Stage 등을 세밀하게 설정할 수 있다. 자세한 내용은 [Scenarios](https://grafana.com/docs/k6/latest/using-k6/scenarios/) 문서를 참조한다.
  ```js
  export const options = {
    scenarios: {
      my_api_scenario: {
        executor: "ramping-vus",
        startVUs: 0,
        stages: [
          { duration: "5s", target: 100 },
          { duration: "5s", target: 0 },
        ],
        gracefulRampDown: "10s",
        env: { MYVAR: "example" },
        tags: { my_tag: "example" },
      },
    },
  };
  ```

- [**hosts**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#hosts) — DNS 테이블을 선언하여 다양한 URL을 매핑한다. 리눅스의 `/etc/hosts` 혹은 윈도우의 `C:\Windows\System32\drivers\etc\hosts`와 유사하며, `"domain": "ip:port"` 형태로 지정한다. v0.42.0부터 와일드카드(asterisk)를 사용할 수 있다.
  ```js
  export const options = {
    hosts: {
      "test.k6.io": "1.2.3.4",
      "test.k6.io:443": "1.2.3.4:8443",
      "*.grafana.com": "1.2.3.4",
    },
  };
  ```

- [**thresholds**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#thresholds) — 테스트 종료 조건을 지정한다. 해당 조건을 초과하면 테스트를 실패로 처리한다.[^10]
  ```js
  export const options = {
    thresholds: {
      http_req_duration: ["avg<100", "p(95)<200"],
      "http_req_connecting{cdnAsset:true}": ["p(95)<100"],
    },
  };
  ```

- [**noConnectionReuse**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#no-connection-reuse) — 기본값은 `false`이며, `true`인 경우 커넥션을 재사용하지 않아 각 요청마다 새 TCP 연결을 맺는다.
  ```js
  export const options = {
    noConnectionReuse: true,
  };
  ```

- [**userAgent**](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/#user-agent) — HTTP 요청을 보낼 때 사용자 agent 정보를 지정한다. 지정한 문자열이 모든 요청 헤더에 실려 전송된다.
  ```js
  export const options = {
    userAgent: "MyK6UserAgentString/1.0",
  };
  ```

# 각 테스트 기법에 따른 k6 구현 💻

k6 옵션을 활용하여 각기 다른 테스트 기법을 적용해볼 수 있다. 시나리오와 함께 사용하면 토큰도 활용할 수 있고 더 정밀한 유스케이스 테스트가 가능하므로, 실무 도입 시 추가적으로 참고하면 좋다.

## Smoke Testing 구현 🔥

기능이 정상 작동하는지만 확인한다.

```js
import http from "k6/http";
import { sleep } from "k6";

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

## Load Testing 구현 📈

- 기준치: 100명
- 램프업: 0명 → 100명 (10s)
- 플랫: 100명 유지 (30s)
- 램프다운: 100명 → 0명 (10s)

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 }, // ramp-up
    { duration: "30s", target: 100 }, // flat
    { duration: "10s", target: 0 },   // ramp-down
  ],
};

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

## Stress Test 구현 💥

기준치였던 100명을 넘어서 200명을 부하한다.

- 램프업: 0명 → 200명 (10s)
- 플랫: 200명 유지 (30s)
- 램프다운: 200명 → 0명 (10s)

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 200 }, // ramp-up
    { duration: "30s", target: 200 }, // flat
    { duration: "10s", target: 0 },   // ramp-down
  ],
};

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

## Spike Test 구현 ⚡

순간적인 부하 급증을 시뮬레이션한다 — 부하 증감의 속도는 동일하다.

- 부하 증가: 0명 → 10000명 (1m)
- 부하 감소: 10000명 → 0명 (1m)

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 10000 }, // spike up
    { duration: "1m", target: 0 },     // spike down
  ],
};

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

## Breakpoint Test 구현 🔍

장애가 나는 지점까지 점진적으로 부하한다 — 2시간 동안 100000명이 될 때까지 VU를 늘린다.

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "2h", target: 100000 }, // continuously ramp up until failure
  ],
};

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

## Soak Test 구현 🧪

장시간 일정한 부하를 지속적으로 걸어 시스템 리소스 누수를 확인한다.

- 램프업: 0명 → 1000명 (5m)
- 플랫: 1000명 유지 (24h)
- 램프다운: 1000명 → 0명 (5m)

```js
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "5m",  target: 1000 }, // ramp-up
    { duration: "24h", target: 1000 }, // soak
    { duration: "5m",  target: 0 },    // ramp-down
  ],
};

export default function () {
  http.get("http://192.168.68.108:3000");
  sleep(1);
}
```

# 결론 🎯

테스트 기법 여섯 가지는 각각 다른 질문에 답한다. Smoke는 "기능이 작동하는가", Load는 "예상 트래픽을 견디는가", Stress는 "기대치를 초과해도 버티는가", Spike는 "순간 폭증을 처리하는가", Breakpoint는 "어디서 무너지는가", Soak는 "오래 두면 리소스가 새는가" 를 확인한다.

k6는 이 여섯 질문 모두를 동일한 JS 스크립트와 `stages` 옵션 조합만으로 구현할 수 있어, 테스트 인프라 부담 없이 시작하기에 적합한 도구다. 이후 k6 Cloud와 Grafana 대시보드를 연동하면 결과 시각화와 팀 공유도 간편하게 처리할 수 있다.

[^1]: https://grafana.com/docs/k6/latest/testing-guides/test-types/smoke-testing/
[^2]: https://grafana.com/docs/k6/latest/testing-guides/test-types/load-testing/
[^3]: https://grafana.com/docs/k6/latest/testing-guides/test-types/stress-testing/
[^4]: https://grafana.com/docs/k6/latest/testing-guides/test-types/spike-testing/
[^5]: https://grafana.com/docs/k6/latest/testing-guides/test-types/breakpoint-testing/
[^6]: https://grafana.com/docs/k6/latest/testing-guides/test-types/soak-testing/
[^7]: https://github.com/grafana/k6
[^8]: https://grafana.com/docs/k6/latest/examples/
[^9]: https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
[^10]: https://grafana.com/docs/k6/latest/using-k6/thresholds/
[^11]: https://eltonminetto.dev/en/post/2024-01-05-load-test-types/
[^12]: https://devocean.sk.com/blog/techBoardDetail.do?ID=164303
[^13]: https://devocean.sk.com/blog/techBoardDetail.do?ID=164310
