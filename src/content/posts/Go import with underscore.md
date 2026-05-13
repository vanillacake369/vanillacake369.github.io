---
title: "Go import with underscore(_)"
description: ""
date: 2025-04-25
tags: [Go]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---

- Golang 작성 중 import 문이 _ 으로된 문이 있어 확인



# What? 뭘 배움?

---

- _ 는 golang 에서 blank identifier 라고 함
- `import _ ~~`는 golang 에서 blank import 라고 함
- 해당 패키지에서 직접적인 의존성이 없으나 호출하는 메서드 내부로직에서 의존하고 있다면 blank import 를 선언하여야 함



# How? 어떻게 씀?

---

만약 우리가 아래와 같이 mysql 드라이버 blank import 를 뺀다면, 

```go
package diff

import (
	"context"
	"db-migration/test/container"
	//_ "github.com/go-sql-driver/mysql"
	"github.com/testcontainers/testcontainers-go"
	"testing"
)

func TestShowDiff(t *testing.T) {
	// GIVEN
	ctx := context.Background()
	mysqlContainer, _ := container.CreatMySQLContainer(ctx)
	testcontainers.CleanupContainer(t, mysqlContainer)

	// WHEN
	oldDB, _ := mysqlContainer.ConnectionString(ctx)
	newDB, _ := mysqlContainer.ConnectionString(ctx)
	driver := "mysql"
	ShowDiff(oldDB, newDB, driver)
}

```

아래와 같이 driver 를 찾을 수 없다며 실패함

![](/images/notion/f7c61c76d559a0a2.png)

반면 제대로 추가해준다면 성공하는 것을 볼 수 있음

```go
package diff

import (
	"context"
	"db-migration/test/container"
	_ "github.com/go-sql-driver/mysql"
	"github.com/testcontainers/testcontainers-go"
	"testing"
)

func TestShowDiff(t *testing.T) {
	// GIVEN
	ctx := context.Background()
	mysqlContainer, _ := container.CreatMySQLContainer(ctx)
	testcontainers.CleanupContainer(t, mysqlContainer)

	// WHEN
	oldDB, _ := mysqlContainer.ConnectionString(ctx)
	newDB, _ := mysqlContainer.ConnectionString(ctx)
	driver := "mysql"
	ShowDiff(oldDB, newDB, driver)
}

```

![](/images/notion/85b85a0aced0b759.png)

# Reference

---

[https://go.dev/doc/effective_go#blank_import](https://go.dev/doc/effective_go#blank_import)
[https://pkg.go.dev/database/sql#Register](https://pkg.go.dev/database/sql#Register)
[https://www.calhoun.io/why-we-import-sql-drivers-with-the-blank-identifier/](https://www.calhoun.io/why-we-import-sql-drivers-with-the-blank-identifier/)
[https://www.digitalocean.com/community/tutorials/understanding-init-in-go](https://www.digitalocean.com/community/tutorials/understanding-init-in-go)
