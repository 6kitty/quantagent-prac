# ssh /reverse ssh tunnel

SSH 리버스 터널링을 이용한 방화벽 서버 접속

~~oci가 당장은 없어서 WSL에~~

WSL은 로컬 통신인 거 같아 리버스 프록시 실습이 애매할 거 같았다 
오라클 계정 생각보다 쉽게 만들어져서 만들었다. 

## create compute instance 

다른 건 그냥 그대로 두어도 되고(필요하다면 이미지 바꾸는 거 정도)
다만 꼭!!! private key, pub key를 다운 받아야 한다. 
~~이전 거 terminate하고 다시 만들었다~~ 

[https://sprout13.tistory.com/67](https://sprout13.tistory.com/67)
위 글 참고해서 개인키, 공개키에 대한 상속 제거 및 보안 설정도 해준다. 

## ssh 접속 

일단 ssh 접속이 잘 되는지 확인해보자. 
위 글에서는 cmd를 사용하는데 나는 기존에 쓰던 vscode extension으로 연결해줬다. 

config 파일에 아래처럼 추가해준다. 

```
Host <ip 주소>
  HostName <ip 주소>
  User opc //oracle linux 이미지이면 opc 
  IdentityFile <key 파일 경로>
```

음 접속해봤더니 아주 잘 된다. 
key 경로 미리 명시해주려면 openssh 설치를 해줘야 한다(이미 되어있어서 과정 문서화 skip)

## 

## nginx로 프록시 서버 설정 

클라이언트 - 프록시서버 - original 서버 

1. 3.35.11.39으로 들어오면 (포트는 보통 HTTP, 80)
2. 이 프록시서버가 포트 포워딩으로 서비스 구동중인 포트로 이어준다. 

windows에서 실습하기엔 무리가 있어서 Ubuntu WSL을 활용했다. 
Ubuntu WSL - NginX(proxy가 될 예정) - oci 


1. 콘솔 접속
https://cloud.oracle.com 접속
로그인
2. Compute 인스턴스 만들기 시작
좌측 상단 메뉴 클릭 ☰ → Compute > Instances 클릭
우측 상단에 있는 “Create Instance” (인스턴스 생성) 클릭
Create compute instance
3. 인스턴스 이름 정하기

Name: 원하는 인스턴스 이름 입력 (예: my-free-vm)
4. 이미지(운영체제) 선택
기본은 Oracle Linux지만, 바꾸고 싶다면:
Change Image and Shape 클릭
Ubuntu, CentOS, Debian 등 선택 가능
5. 인스턴스 Shape 선택 (Always Free 사용 시)
Shape 탭에서 Change Shape 클릭
VM.Standard.A1.Flex (ARM 기반) (추천)
Always Free 자원에서 무료로 제공되는 인스턴스
OCPU: 1, Memory: 1GB ~ 6GB, 1 Gbps network bandwidth
→ 예: 1 OCPU, 6GB RAM (Free 티어 내 최대)
VM.Standard.E2.1.Micro (x86 기반)
Always Free 자원에서 무료로 제공되는 인스턴스
OCPU: 1, Memory: 1GB, 0.48 Gbps network bandwidth
6. 네트워크 설정
기본으로 생성된 VCN과 Subnet 선택하거나 새로 생성
Public IP 지정을 “할당”으로 설정 (인터넷 접속용)
7. SSH 키 설정 (중요)
접속할 때 사용할 SSH 공개 키(Public Key) 필요
“Generate SSH Key pair” 눌러 생성 → 다운로드 꼭 저장!

가장 중요한 항목이다. 클라우드 인스턴스에 접속하기 위한 방법 중 하나인 SSH를 설정할 수 있다.

'전용 키'만 내려받을 수도 있지만, '전용 키'와 '공용 키' 두 가지를 모두 내려받는 것이 좋다. 이 키 파일과 SSH를 이용하여 클라우드에 접속한다.

키 파일은 이 화면에서만 내려받을 수 있기 때문에, 키를 미리 백업해 두는 것을 추천한다.

