---
title: "OSM 기반 추천경로 시스템"
description: ""
date: 2025-06-17
tags: [System Design]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

- TMAP 추천경로 API 보완용으로 자체구축 PoC 를 진행



# What? 뭘 배움?

---

## 요구사항

- GTFS 기반 데이터를 활용할 것
- 다양한 교통수단을 지원해야할 것
- 최소시간경로를 반환해야할 것
- 추천경로에 대해 경로들과 노선들이 반환되어야 할 것



## Routing Engine Libraries

> 💡 자세한 내용 — 라우팅 엔진 개념, 추천경로 알고리즘, 동작원리 등등 — 은 PoC 진행 이후에 따로 정리하겠다

필자는 Valhalla 를 PoC 로 삼았다.

- **Valhalla **✅

일단 가볍고, 그나마 성능이 괜찮고 성숙도도 높은 편이다.
만약 Valhalla 의 수치가 괜찮은 정도라면, 
커스터마이징을 추가로 하거나 OSRM 혹은 Graphhopper 로 마이그레이션 하는 것도 괜찮겠다 싶다.

그렇다면 미적합하다고 생각한 다른 라우팅 엔진들은 무엇이 있을까?

- **OSRM**
- **GraphHopper**
- [**Motis**](https://github.com/motis-project/motis)
- [**OpenTripPlanner**](https://github.com/opentripplanner/OpenTripPlanner)
- **R5 (Rapid Realistic Routing on Real-world and Open data)**
- **pgRouting + Custom GTFS Ingestion**

| **OSRM** | **Graphhopper** | **Valhalla** | **Openrouteservice** | **pgRouting** |
| --- | --- | --- | --- | --- |
| **Profiles**Car | ✔️ | ✔️ | ✔️ | ✔️ |
| Truck | ❎ | ❎ | ✔️ | ✔️ |
| Pedestrian | ✔️ | ✔️ | ✔️ | ✔️ |
| Bike | ✔️ | ✔️ | ✔️ | ✔️ |
| Transit | ❎ | ✔️ | ✔️ | ❎ |
| Others | - | other bikesmotorcyclehikingwheelchair | taxibusscootermotorcycle | other bikeswheelchairhiking |
| **API**Routing | ✔️ | ✔️ | ✔️ | ✔️ |
| Isochrones | ❎ | ✔️ | ✔️ | ✔️ |
| Matrix | ✔️ | ❎ | ✔️ | ✔️ |
| Map Matching | ✔️ | ✔️ | ✔️ | ❎ |
| Optimization | ❎ | ❎ | ✔️ | ❎ |
| **Features**Turn restrictions | ✔️ | ✔️ | ✔️ | ❎ |
| Avoid locations/polygons | ❎ | ✔️ | ✔️ | ✔️ |
| Dynamic vehicle attributes | ❎ | ✔️ | ✔️ | ✔️ |
| Alternative routes | ✔️ | ✔️ | ✔️ | ✔️ |
| Round trips | ❎ | ✔️ | ❎ | ✔️ |
| Time awareness | ❎ | ❎ | ✔️ | ❎ |
| Elevation | ❎ | ✔️ | ✔️ | ✔️ |
| **Activity** [2](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote2) | *** | ***** | ***** | * |
| **Performance**[3](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote3) | ***** | **** | *** | **** |
| **RAM requirements** [4](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote4) | * | *** | **** | * |
| **Customizability***[5](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote5) | *** | *** | ** | * |
| **Flexibility**[6](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote6) | * | *** | **** | * |
| **Mobile**[7](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote7) | ❎ | ✔️ | ✔️ | ❎ |


# How? 어떻게 씀?

---

이러다가 3시 넘어서 작업하고 있겠다 싶어서 처리과정만 남겨본다.
오전에 열심히 만지작거려보도록,,,

1. [openstreetmap 한국 pbf 파일을 준비한다.](https://osm.kr/usage/#:~:text=대한민국)
2. 대중교통 데이터셋을 받는다.
3. [github 에 올라와있는 valhalla docker image](https://github.com/nilsnolde/docker-valhalla#build-valhalla-with-transit:~:text=To%20enable%20multimodal%20routing%2C%20you%27ll%20need%20to%20map%20the%20directory%20which%20contains%20all%20the%20GTFS%20feeds%20to%20the%20container%27s%20/gtfs_feeds%20directory%2C%20e.g.) 를 설치
4. [Optimized Route API](https://valhalla.github.io/valhalla/api/optimized/api-reference/#optimized-route-service-action) 를 쏴본다.


메모리랑 CPU 엄청 쓰네 ㅎㄷㄷㄷ

![](/images/notion/2220a6186cfbda07.png)

# Reference

---

[https://ibrahimsaricicek.medium.com/routing-alternatives-with-custom-spatial-data-dbb2a9175ef2](https://ibrahimsaricicek.medium.com/routing-alternatives-with-custom-spatial-data-dbb2a9175ef2)
[https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote4](https://github.com/gis-ops/tutorials/blob/master/general/foss_routing_engines_overview.md#user-content-footnote4)
[https://news.ycombinator.com/item?id=11910927](https://news.ycombinator.com/item?id=11910927)
[https://news.ycombinator.com/item?id=17001422](https://news.ycombinator.com/item?id=17001422)
[https://news.ycombinator.com/item?id=11661659](https://news.ycombinator.com/item?id=11661659)
[https://nextbillion.ai/blog/top-open-source-tools-for-route-optimization](https://nextbillion.ai/blog/top-open-source-tools-for-route-optimization)
[https://github.com/motis-project/motis/issues/423](https://github.com/motis-project/motis/issues/423)
[https://news.ycombinator.com/item?id=22776823](https://news.ycombinator.com/item?id=22776823)
[https://medium.com/citymapper/building-a-city-without-open-data-124356672deb](https://medium.com/citymapper/building-a-city-without-open-data-124356672deb)
[https://www.reddit.com/r/openstreetmap/comments/1fqfgfd/multimodal_route_optimizer/](https://www.reddit.com/r/openstreetmap/comments/1fqfgfd/multimodal_route_optimizer/)
[https://klaus9267.tistory.com/50](https://klaus9267.tistory.com/50)
