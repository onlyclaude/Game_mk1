# 회색의 연대기 (Chronicle of Grey)

태블릿과 PC 브라우저에서 플레이하는 2D 웹 RPG입니다. 현재 개발 2단계(캐릭터 생성·사건·판정)까지 완료된 상태입니다. 진행 현황은 [PLAN.md](PLAN.md)를 보세요.

## 실행 방법
Node.js가 설치되어 있어야 합니다.

```bash
npm start
```

브라우저에서 http://localhost:8000 을 엽니다. 같은 와이파이의 태블릿에서는 `http://<컴퓨터의 IP 주소>:8000` 으로 접속할 수 있습니다.

> `index.html` 파일을 더블클릭해서 열면 동작하지 않습니다(브라우저 보안 정책상 ES Modules는 서버를 통해 열어야 합니다).

## 테스트
```bash
npm test          # 저장/불러오기 등 로직 테스트
npm run test:e2e  # 브라우저 자동 테스트 (Playwright 필요)
```
