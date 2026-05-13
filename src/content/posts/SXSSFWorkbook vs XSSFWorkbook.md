---
title: "SXSSFWorkbook vs XSSFWorkbook"
description: "The three *Workbook* classes available in Apache POI are *HSSFWorkbook*, *XSSFWorkbook*, and *SXSSFWorkbook."
date: 2025-04-25
tags: [java]
category: uncategorized
lang: ko
draft: false
---

# Why? 왜 배움?

---



# What? 뭘 배움?

---

> 부가적인 설명이 의미가 없는 거 같아 그냥 baeldung 에 있는 내용 가져왔다.

The three *Workbook* classes available in Apache POI are *HSSFWorkbook*, *XSSFWorkbook*, and *SXSSFWorkbook. *They share similarities yet offer distinct functionalities catering to different file formats and use cases. Here’s a quick summary of their main characteristics:

|  | HSSFWorkbook | XSSFWorkbook | SXSSFWorkbook |
| --- | --- | --- | --- |
| File Format | .xls (BIFF8 binary, Excel 97-2003) | .xlsx (OpenXML, Excel 2007+) | .xlsx (OpenXML, Excel 2007+) |
| Max Rows per Sheet | 65,536 | 1,048,576 | 1,048,576 |
| Max Columns per Sheet | 256 | 16,384 | 16,384 |
| Streaming Workbook | No | No | Yes |
| Memory Usage | High | High | Low |


In short, *HSSFWorkbook* produces Excel files in the older *.xls* format. The *XSSFWorkbook* and *SXSSFWorkbook* create files in the XML-based *.xlsx* format used by Excel 2007 and later.
**Both *****HSSFWorbook***** and *****XSSFWorkbook***** are non-streaming workbooks that keep all rows of data in memory, whereas *****SXSSFWorkbook***** is a streaming workbook that only retains a certain number of rows in memory.** Hence, it’s much more memory-efficient if the dataset is huge.

,,,,


# **5.2. Execution Time**

| Number of Rows | HSSFWorkbook | XSSFWorkbook | SXSSFWorkbook |
| --- | --- | --- | --- |
| 2,500 | 73 | 2,658 | 296 |
| 5,000 | 174 | 4,522 | 612 |
| 10,000 | 347 | 10,994 | 1,808 |
| 20,000 | 754 | 21,733 | 3,751 |
| 40,000 | 1,455 | 42,331 | 7,342 |


Among the three classes, the *HSSFWorkbook* is always faster compared to the *XSSFWorkbook* and the *SXSSFWorkbook*. The *XSSFWorkbook* shows the highest execution time, which is around 30 times slower than the *HSSFWorkbook*. The *SXSSFWorkbook* class provides a compromise between the two.
**The reason for such results could be that the binary *****.xls***** format is less complex to handle. It’s evident that the XML-based *****.xlsx***** format requires more processing, and such slowdown will be more significant with larger datasets.**

# **5.3. Memory Consumption**

| Number of Rows | HSSFWorkbook | XSSFWorkbook | SXSSFWorkbook |
| --- | --- | --- | --- |
| 2,500 | 828 | 1,871 | 258 |
| 5,000 | 1,070 | 2,926 | 212 |
| 10,000 | 1,268 | 4,136 | 209 |
| 20,000 | 1,766 | 7,443 | 209 |
| 40,000 | 1,475 | 10,119 | 210 |


For both the *HSSFWorkbook* and the *XSSFWorkbook*, the memory consumption grows with the number of rows. That’s because these *Workbook* classes store all data in memory. However, the *XSSFWorkbook* grows significantly more than the *HSSFWorkbook*.
***SXSSFWorkbook***** is the clear winner in terms of memory efficiency. Its memory consumption remains almost constant, regardless of the number of rows, at around 210MB.**
This is due to its streaming behavior, where only a small portion of rows is kept in memory at any given time. This makes *SXSSFWorkbook* ideal for handling large datasets without running out of memory.

# How? 어떻게 씀?

---

`XSSFWorkbook`

```go
Workbook workbook = new XSSFWorkbook(inputStream);
```

`SXSSFWorkbook`

```go
Workbook workbook = new SXSSFWorkbook(new XSSFWorkbook(inputStream));
```

# Reference

---

[https://www.baeldung.com/java-apache-poi-workbook-evaluation](https://www.baeldung.com/java-apache-poi-workbook-evaluation)
