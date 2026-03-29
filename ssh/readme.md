# SSH / Reverse SSH Tunnel

> SSH 리버스 터널링을 이용한 방화벽 서버 접속

---

# OCI 컴퓨트 인스턴스 생성

## 생성 단계

1. **콘솔 접속** — [cloud.oracle.com](https://cloud.oracle.com) 로그인
2. **인스턴스 생성** — ☰ → Compute > Instances → Create Instance
3. **이름 지정** — 원하는 인스턴스 이름 입력 (예: `my-free-vm`)
4. **이미지 선택** — 기본 Oracle Linux, 변경 원하면 Change Image and Shape에서 Ubuntu/Debian 등 선택
5. **Shape 선택** — Always Free 기준

   | Shape | 아키텍처 | OCPU | Memory | 네트워크 |
   |-------|---------|------|--------|---------|
   | VM.Standard.A1.Flex | ARM | 1 | 1~6 GB | 1 Gbps |
   | VM.Standard.E2.1.Micro | x86 | 1 | 1 GB | 0.48 Gbps |

   → A1.Flex (ARM) 추천. Free 티어 내 최대 1 OCPU / 6 GB RAM까지 가능.

6. **네트워크 설정** — 기본 VCN/Subnet 선택, Public IP는 **할당**으로 설정
7. **SSH 키 설정** — Generate SSH Key pair로 생성 → **전용 키 + 공용 키 모두 다운로드 필수**

> 키 파일은 이 화면에서만 내려받을 수 있다. 반드시 백업해둘 것.

참고: [SSH 키 상속 제거 및 보안 설정](https://sprout13.tistory.com/67)

---

# SSH 접속

SSH 접속이 잘 되는지 먼저 확인한다. VSCode Remote SSH extension 사용 기준으로 아래처럼 config에 추가한다.

```
Host <ip 주소>
  HostName <ip 주소>
  User opc
  IdentityFile <key 파일 경로>
```

> `User opc` — Oracle Linux 이미지 기준. key 경로 명시를 위해 OpenSSH가 설치되어 있어야 한다.

---

# Nginx 리버스 프록시 설정

## 개념

개인 프로젝트(Discord 봇)에서 GitHub 웹훅을 8080 포트로 직접 노출하고 있었는데, 스캔봇이 훑고 가서 리버스 프록시로 교체했다.

**기존 구조 (문제)**
```
Internet → 8080 (FastAPI)
```

| 문제 | 설명 |
|-----|------|
| 포트 직접 노출 | 공격 표면이 넓음 |
| 트래픽 필터 없음 | CONNECT 같은 쓰레기 트래픽 그대로 수신 |

**변경 구조 (리버스 프록시)**
```
Internet → 80/443 (nginx) → 127.0.0.1:8080 (FastAPI)
```

| 장점 | 설명 |
|-----|------|
| 보안 | 외부는 nginx만 보임, FastAPI는 내부(`127.0.0.1`)에만 바인딩 |
| 요청 필터링 | nginx 레벨에서 메서드/IP 차단 가능 |
| HTTPS 처리 | SSL 인증서를 nginx에서만 관리, FastAPI는 HTTP만 사용 |

---

## FastAPI 호스트 설정

FastAPI 앱에서 host를 `0.0.0.0` 대신 **`127.0.0.1`** 로 선언해야 외부에서 직접 8080에 접근하지 못한다.

```python
def run_webhook_server():
    host = os.getenv("WEBHOOK_HOST", "127.0.0.1")  # 0.0.0.0 아님!
    port = int(os.getenv("WEBHOOK_PORT", "8080"))
    uvicorn.run(webhook_app, host=host, port=port, log_level="info")
```

---

## Nginx 설정

Ubuntu WSL 환경 기준으로 진행. (`Ubuntu WSL → NginX → OCI`)

```bash
sudo vi /etc/nginx/sites-available/6kitty
```

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;

server {
    listen 80;
    server_name _;

    # CONNECT 메서드 차단 (프록시 공격 방지)
    if ($request_method = CONNECT) {
        return 405;
    }

    location / {
        limit_req zone=api_limit burst=10 nodelay;

        proxy_pass http://127.0.0.1:8080;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/6kitty /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 방화벽 설정

nginx가 app 레이어에서 프록시를 처리하므로 외부에는 80과 22만 열면 된다 (8080 불필요).

**Cloud 방화벽 (OCI)**

OCI 콘솔에서: 인스턴스 → 서브넷 → 보안 룰 → Ingress Rules에 80 포트 추가

**OS 방화벽 (ufw)**

```bash
sudo ufw default deny incoming
sudo ufw allow 22
sudo ufw allow 80
sudo ufw enable
```

## 검증

```bash
# 외부에서 CONNECT 메서드 차단 확인
curl -X CONNECT http://146.56.109.69
# → 405 Not Allowed
```
