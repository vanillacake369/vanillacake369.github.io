---
title: "AWS 자격증 준비"
description: "CKA / LFCS 는 각 개념 별로 홈랩에 설치해가며 실습 :: k8s cluster, network, pv/pvc, rbac/security"
date: 2026-03-22
tags: [system-design]
category: uncategorized
lang: ko
draft: false
---

## AWS SAA 덤프 스터디

# Schedule

- CKA : 3월 29일(일)
- LFCS : 4월 5일 (일)
- AWS SAA : 4월 12일 (일)

CKA / LFCS 는 각 개념 별로 홈랩에 설치해가며 실습 :: k8s cluster, network, pv/pvc, rbac/security
SAA 는 일일 덤프 60문제 풀이하여 전체 문제 풀기

# Reference

[https://www.examtopics.com/exams/amazon/aws-certified-solutions-architect-associate-saa-c03/](https://www.examtopics.com/exams/amazon/aws-certified-solutions-architect-associate-saa-c03/)
[https://limreus.tistory.com/194](https://limreus.tistory.com/194)
[https://blog.naver.com/imaokiro/222919408684](https://blog.naver.com/imaokiro/222919408684)


# Week 01

## Question #1 ❌

A company collects data for temperature, humidity, and atmospheric pressure in cities across multiple continents. The average volume of data that the company collects from each site daily is 500 GB. Each site has a high-speed Internet connection.
The company wants to aggregate the data from all these global sites as quickly as possible in a single Amazon S3 bucket. The solution must minimize operational complexity.
Which solution meets these requirements?

- A. Turn on S3 Transfer Acceleration on the destination S3 bucket. Use multipart uploads to directly upload site data to the destination S3 bucket.
- B. Upload the data from each site to an S3 bucket in the closest Region. Use S3 Cross-Region Replication to copy objects to the destination S3 bucket. Then remove the data from the origin S3 bucket.
- C. Schedule AWS Snowball Edge Storage Optimized device jobs daily to transfer data from each site to the closest Region. Use S3 Cross-Region Replication to copy objects to the destination S3 bucket.
- D. Upload the data from each site to an Amazon EC2 instance in the closest Region. Store the data in an Amazon Elastic Block Store (Amazon EBS) volume. At regular intervals, take an EBS snapshot and copy it to the Region that contains the destination S3 bucket. Restore the EBS volume in that Region.

> 💡 풀이 / 해설

## Question #2 ❌

A company needs the ability to analyze the log files of its proprietary application. The logs are stored in JSON format in an Amazon S3 bucket. Queries will be simple and will run on-demand. A solutions architect needs to perform the analysis with minimal changes to the existing architecture.
What should the solutions architect do to meet these requirements with the LEAST amount of operational overhead?

- A. Use Amazon Redshift to load all the content into one place and run the SQL queries as needed.
- B. Use Amazon CloudWatch Logs to store the logs. Run SQL queries as needed from the Amazon CloudWatch console.
- C. Use Amazon Athena directly with Amazon S3 to run the queries as needed.
- D. Use AWS Glue to catalog the logs. Use a transient Apache Spark cluster on Amazon EMR to run the SQL queries as needed.

> 💡 풀이 / 해설

## Question #3 ❌

A company uses AWS Organizations to manage multiple AWS accounts for different departments. The management account has an Amazon S3 bucket that contains project reports. The company wants to limit access to this S3 bucket to only users of accounts within the organization in AWS Organizations.
Which solution meets these requirements with the LEAST amount of operational overhead?

- A. Add the aws PrincipalOrgID global condition key with a reference to the organization ID to the S3 bucket policy.
- B. Create an organizational unit (OU) for each department. Add the aws:PrincipalOrgPaths global condition key to the S3 bucket policy.
- C. Use AWS CloudTrail to monitor the CreateAccount, InviteAccountToOrganization, LeaveOrganization, and RemoveAccountFromOrganization events. Update the S3 bucket policy accordingly.
- D. Tag each user that needs access to the S3 bucket. Add the aws:PrincipalTag global condition key to the S3 bucket policy.

> 💡 풀이 / 해설

## Question #4

An application runs on an Amazon EC2 instance in a VPC. The application processes logs that are stored in an Amazon S3 bucket. The EC2 instance needs to access the S3 bucket without connectivity to the internet.
Which solution will provide private network connectivity to Amazon S3?

- A. Create a gateway VPC endpoint to the S3 bucket.
- B. Stream the logs to Amazon CloudWatch Logs. Export the logs to the S3 bucket.
- C. Create an instance profile on Amazon EC2 to allow S3 access.
- D. Create an Amazon API Gateway API with a private link to access the S3 endpoint.

> 💡 풀이 / 해설

## Question #5 ❌

A company is hosting a web application on AWS using a single Amazon EC2 instance that stores user-uploaded documents in an Amazon EBS volume. For better scalability and availability, the company duplicated the architecture and created a second EC2 instance and EBS volume in another Availability Zone, placing both behind an Application Load Balancer. After completing this change, users reported that, each time they refreshed the website, they could see one subset of their documents or the other, but never all of the documents at the same time.
What should a solutions architect propose to ensure users see all of their documents at once?

- A. Copy the data so both EBS volumes contain all the documents
- B. Configure the Application Load Balancer to direct a user to the server with the documents
- C. Copy the data from both EBS volumes to Amazon EFS. Modify the application to save new documents to Amazon EFS
- D. Configure the Application Load Balancer to send the request to both servers. Return each document from the correct server

> 💡 풀이 / 해설

## Question #6

A company uses NFS to store large video files in on-premises network attached storage. Each video file ranges in size from 1 MB to 500 GB. The total storage is 70 TB and is no longer growing. The company decides to migrate the video files to Amazon S3. The company must migrate the video files as soon as possible while using the least possible network bandwidth.
Which solution will meet these requirements?

- A. Create an S3 bucket. Create an IAM role that has permissions to write to the S3 bucket. Use the AWS CLI to copy all files locally to the S3 bucket.
- B. Create an AWS Snowball Edge job. Receive a Snowball Edge device on premises. Use the Snowball Edge client to transfer data to the device. Return the device so that AWS can import the data into Amazon S3.
- C. Deploy an S3 File Gateway on premises. Create a public service endpoint to connect to the S3 File Gateway. Create an S3 bucket. Create a new NFS file share on the S3 File Gateway. Point the new file share to the S3 bucket. Transfer the data from the existing NFS file share to the S3 File Gateway.
- D. Set up an AWS Direct Connect connection between the on-premises network and AWS. Deploy an S3 File Gateway on premises. Create a public virtual interface (VIF) to connect to the S3 File Gateway. Create an S3 bucket. Create a new NFS file share on the S3 File Gateway. Point the new file share to the S3 bucket. Transfer the data from the existing NFS file share to the S3 File Gateway.

> 💡 풀이 / 해설



# Week 02

### 개념 공부

[https://www.inflearn.com/course/%EC%89%BD%EA%B2%8C-%EC%84%A4%EB%AA%85%ED%95%98%EB%8A%94-aws-%EA%B8%B0%EC%B4%88](https://www.inflearn.com/course/%EC%89%BD%EA%B2%8C-%EC%84%A4%EB%AA%85%ED%95%98%EB%8A%94-aws-%EA%B8%B0%EC%B4%88)


### 서비스 연결/네트워크 가속 관련 덤프

- [**Question 4**](https://www.examtopics.com/discussions/amazon/view/84980-exam-aws-certified-solutions-architect-associate-saa-c03/)[: VPC Endpoint를 사용한 S3 프라이빗 연결 (S3 서비스 연결).](https://www.examtopics.com/discussions/amazon/view/84980-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 29**](https://www.examtopics.com/discussions/amazon/view/85029-exam-aws-certified-solutions-architect-associate-saa-c03/)[: Global Accelerator와 ALB/NLB를 사용한 리전 간 라우팅 및 지연 최소화 (네트워크 가속).](https://www.examtopics.com/discussions/amazon/view/85029-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 55**](https://www.examtopics.com/discussions/amazon/view/85409-exam-aws-certified-solutions-architect-associate-saa-c03/)[: VPC 서브넷과 RDS 접근 제어 (VPC 연결).](https://www.examtopics.com/discussions/amazon/view/85409-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 240**](https://www.examtopics.com/discussions/amazon/view/94998-exam-aws-certified-solutions-architect-associate-saa-c03/)[: Direct Connect와 데이터 전송 최적화 (네트워크 연결).](https://www.examtopics.com/discussions/amazon/view/94998-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 443**](https://www.examtopics.com/discussions/amazon/view/109424-exam-aws-certified-solutions-architect-associate-saa-c03/)[: Global Accelerator를 사용한 업로드/다운로드 지연 최소화 (네트워크 가속).](https://www.examtopics.com/discussions/amazon/view/109424-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 722**](https://www.examtopics.com/discussions/amazon/view/132895-exam-aws-certified-solutions-architect-associate-saa-c03/)[: Direct Connect와 다중 VPC 연결 관리 (서비스 연결).](https://www.examtopics.com/discussions/amazon/view/132895-exam-aws-certified-solutions-architect-associate-saa-c03/)
- [**Question 899**](https://www.examtopics.com/discussions/amazon/view/140211-exam-aws-certified-solutions-architect-associate-saa-c03/)[: VPC 간 공유 서비스 연결 및 마이그레이션 (VPC Lattice 등)](https://www.examtopics.com/discussions/amazon/view/140211-exam-aws-certified-solutions-architect-associate-saa-c03/)

# Week 03

## Question #263

회사에서 여러 마이크로서비스로 구성된 애플리케이션을 구축하고 있습니다. 
이 회사는 컨테이너 기술을 사용하여 AWS 에 소프트웨어를 배포하기로 결정했습니다. 
회사는 유지 관리 및 확장을 위한 지속적인 노력을 최소화하는 솔루션이 필요합니다. 
회사는 추가 인프라를 관리할 수 없습니다.
이러한 요구 사항을 충족하기 위해 솔루션 설계자는 어떤 작업 조합을 수행해야 합니까?
(2 개 선택)
A. Amazon Elastic Container Service(Amazon ECS) 클러스터를 배포합니다.
B. 여러 가용 영역에 걸쳐 있는 Amazon EC2 인스턴스에 Kubernetes 제어 평면을
배포합니다.
C. Amazon EC2 시작 유형으로 Amazon Elastic Container Service(Amazon ECS) 서비스를
배포합니다. 2 보다 크거나 같은 원하는 태스크 번호 레벨을 지정하십시오.
D. Fargate 시작 유형으로 Amazon Elastic Container Service(Amazon ECS) 서비스를
배포합니다. 2 보다 크거나 같은 원하는 태스크 번호 레벨을 지정하십시오.
E. 여러 가용 영역에 걸쳐 있는 Amazon EC2 인스턴스에 Kubernetes 작업자 노드를
배포합니다. 각 마이크로 서비스에 대해 두 개 이상의 복제본을 지정하는 배포를 만듭니다.

> 💡 풀이 / 해설

## Question #264

회사에는 Amazon Route 53 에서 전달하는 트래픽이 있는 10 개 이상의 Amazon EC2 인스턴스를 호스팅하는 웹 애플리케이션이 있습니다. 
회사에서 애플리케이션을 검색하려고 할 때 때때로 시간 초과 오류가 발생합니다. 
네트워킹 팀은 일부 DNS 쿼리가 비정상 인스턴스의 IP 주소를 반환하여 시간 초과 오류가 발생했음을 발견했습니다.
이러한 시간 초과 오류를 극복하기 위해 솔루션 설계자는 무엇을 구현해야 합니까?
A. 각 EC2 인스턴스에 대해 Route 53 단순 라우팅 정책 레코드를 생성합니다. 상태 확인을
각 레코드와 연결합니다.
B. 각 EC2 인스턴스에 대해 Route 53 장애 조치 라우팅 정책 레코드를 생성합니다. 상태
확인을 각 레코드와 연결합니다.
C. EC2 인스턴스를 원본으로 사용하여 Amazon CloudFront 배포를 생성합니다. 상태
확인을 EC2 인스턴스와 연결합니다.
D. EC2 인스턴스 앞에서 상태 확인을 통해 Application Load Balancer(ALB)를 생성합니다.
루트 53 에서 ALB 로 이동합니다

> 💡 풀이 / 해설

## Question #12

글로벌 회사는 ALB(Application Load Balancer) 뒤의 Amazon EC2 인스턴스에서 웹 애플리케이션을 호스팅합니다. 웹 애플리케이션에는 정적 데이터와 동적 데이터가 있습니다.
회사는 정적 데이터를 Amazon S3 버킷에 저장합니다. 
회사는 정적 데이터 및 동적 데이터의 성능을 개선하고 대기 시간을 줄이기를 원합니다. 
회사는 Amazon Route 53 에 등록된 자체 도메인 이름을 사용하고 있습니다.
솔루션 설계자는 이러한 요구 사항을 충족하기 위해 무엇을 해야 합니까?
A. S3 버킷과 ALB 를 오리진으로 포함하는 Amazon CloudFront 배포를 생성합니다.
CloudFront 배포로 트래픽을 라우팅하도록 Route 53 을 구성합니다.
B. ALB 가 오리진인 Amazon CloudFront 배포를 생성합니다. S3 버킷을 엔드포인트로
포함하는 AWS Global Accelerator 표준 액셀러레이터를 생성합니다. CloudFront 배포로
트래픽을 라우팅하도록 Route 53 을 구성합니다.
C. S3 버킷을 오리진으로 포함하는 Amazon CloudFront 배포를 생성합니다. ALB 및
CloudFront 배포를 엔드포인트로 포함하는 AWS Global Accelerator 표준 액셀러레이터를
생성합니다. 가속기 DNS 이름을 가리키는 사용자 지정 도메인 이름을 만듭니다. 사용자
지정 도메인 이름을 웹 애플리케이션의 끝점으로 사용합니다.
D. ALB 가 오리진인 Amazon CloudFront 배포를 생성합니다. S3 버킷을 엔드포인트로
포함하는 AWS Global Accelerator 표준 액셀러레이터를 생성합니다. 두 개의 도메인 이름을
만듭니다. 하나의 도메인 이름이 동적 콘텐츠의 CloudFront DNS 이름을 가리키도록 합니다.
다른 도메인 이름이 정적 콘텐츠에 대한 가속기 DNS 이름을 가리키도록 합니다. 도메인
이름을 웹 애플리케이션의 끝점으로 사용합니다

> 💡 풀이 / 해설
