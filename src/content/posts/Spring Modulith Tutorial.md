---
title: "Spring Modulith Tutorial"
description: "Spring Modulith로 모놀리스를 모듈 단위로 설계하는 튜토리얼. NamedInterface, 모듈 검증, PlantUML 문서화 방법을 다룬다."
date: 2025-03-19
tags: [system-design]
lang: ko
draft: false
---

[https://github.com/vanillacake369/spring-modulith-tutorial](https://github.com/vanillacake369/spring-modulith-tutorial)

모듈 / 레포 분리 시 고려해야할 부분
App 이 죽었을 때의 Saga 및 EDA 구조를 위해서는 ,,,

- Kafka
- 이벤트 소싱 로깅
- Debezium (CDC)
- Zipkin

Monolith 에서 제일 이해 안 되는 점

- pacakge-info 를 domain root package 에 두었을 때 아래와 같이 하위 패키지를 모두 의존해야하는지?
- NamedInterface 를 쓰고 안 쓰고의 차이점이 무엇인지 ??

![](/images/notion/88989aea5cabead4.png)
![](/images/notion/5c29f802f6be2e49.png)

![](/images/notion/8993263d109b44a9.png)
![](/images/notion/4ed8ef2f9e28ead7.png)

![](/images/notion/578e1c97cfba7bd6.png)
![](/images/notion/aedc436a48ada9f7.png)

/build/spring-modulith-docs/module
[https://www.plantuml.com/plantuml/uml/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000](https://www.plantuml.com/plantuml/uml/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000)

```nix
@SpringBootTest
class SpringModulithTutorialApplicationTests {

    @Test
    void contextLoads() {
    }

    @Test
    void createApplicationModuleModel() {
        ApplicationModules modules = ApplicationModules.of(SpringModulithTutorialApplication.class);
//        modules.forEach(System.out::println);
//        modules.verify();
        new Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml();
    }
}

```

![](/images/notion/15ac5abbe54143a5.png)
![](/images/notion/0d2406bff80db821.png)
