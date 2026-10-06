# 결 — 나만의 웹페이지 번역기

현재 Chrome 탭에서 화면에 보이는 텍스트를 추출해 Next.js API로 보내고, OpenAI API 번역 결과를 원래 페이지 구조를 유지한 채 적용하는 개인용 번역기입니다.

## 구성

- `app/`: Vercel에 배포하는 Next.js 웹사이트와 `/api/translate` API
- `extension/`: Chrome Manifest V3 확장 프로그램
- 번역할 때 HTML을 통째로 교체하지 않습니다. 화면 안의 텍스트 노드만 보내고 바꿔 페이지의 링크, 스타일, 레이아웃을 유지합니다.

## 1. 서버 배포

저장소를 Vercel에 연결하고 다음 환경 변수를 설정한 뒤 배포하세요.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 예 | OpenAI 대시보드에서 발급한 API 키 |
| `TRANSLATE_API_TOKEN` | 예 | API 호출을 제한할 개인용 긴 임의 토큰 |
| `OPENAI_MODEL` | 아니요 | 사용할 모델. 기본값은 `gpt-4o-mini` |

로컬 개발 시 `.env.example`을 `.env.local`로 복사하고 실제 값을 입력합니다. 토큰은 PowerShell에서 `[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")`으로 생성할 수 있습니다. 실제 값은 코드나 Git에 저장하지 마세요.

```powershell
npm run dev
```

API 주소는 `http://localhost:3000/api/translate`입니다. `OPENAI_API_KEY`와 `TRANSLATE_API_TOKEN`이 모두 설정되어야 호출할 수 있습니다.

## 2. Chrome 확장 프로그램 설치

1. Chrome에서 `chrome://extensions`를 열고 **개발자 모드**를 켭니다.
2. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
3. 이 저장소의 `extension` 폴더를 선택합니다.
4. 확장 프로그램 아이콘을 눌러 서버 주소, `TRANSLATE_API_TOKEN`, 번역 언어를 입력하고 **설정 저장 및 서버 연결**을 누릅니다.
5. 브라우저가 서버 주소 접근 권한을 물으면 허용합니다. 권한은 입력한 서버 도메인에만 요청합니다.
6. 번역할 웹페이지의 화면을 원하는 위치로 스크롤한 뒤 확장 프로그램에서 **현재 화면 번역하기**를 누릅니다.

확장 프로그램의 서버 주소에는 배포한 Vercel 사이트의 origin만 입력하세요. 예: `https://my-translator.vercel.app`. 로컬 테스트는 `http://localhost:3000`을 사용할 수 있습니다. 접근 토큰은 Chrome 로컬 저장소에 저장되고 번역 API 요청에만 사용됩니다.

## 번역 API

`POST /api/translate`는 다음 형식으로 요청하고 같은 순서의 번역 문자열을 반환합니다.

```http
Authorization: Bearer <TRANSLATE_API_TOKEN>
Content-Type: application/json
```

```json
{
  "texts": ["A sentence to translate."],
  "targetLanguage": "한국어"
}
```

```json
{
  "translations": ["번역할 문장입니다."]
}
```

한 요청은 최대 50개 텍스트 노드, 총 12,000자까지 처리합니다. 지원 언어는 한국어, 영어, 일본어, 중국어 간체, 프랑스어, 스페인어, 독일어입니다. 번역 대상 텍스트는 서버를 거쳐 OpenAI API로 전송되며, 이 요청에서 HTML, 쿠키, 입력 폼 값은 보내지 않습니다. OpenAI API 사용량은 설정한 계정에 청구됩니다.

## 점검

```powershell
npm run lint
npm run build
```
