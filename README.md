# Space Invaders

React, Phaser 3, Tauri로 만든 스페이스 인베이더 스타일 데스크톱/브라우저 게임입니다. 800x600 Phaser 게임 화면을 React 앱 안에 렌더링하고, Tauri 2로 데스크톱 앱 번들을 생성합니다.

## 게임 데모
https://invaders-web.vercel.app/

## 주요 기능

- 5행 x 11열, 총 55개의 인베이더 배치
- 오징어, 게, 문어 3종 적과 타입별 점수 체계
- 2프레임 픽셀 스프라이트 애니메이션
- 플레이어 3목숨, 피격 후 리스폰 및 2초 무적 시간
- 플레이어는 한 번에 한 발만 발사 가능
- 각 열의 가장 아래 적이 무작위로 적 탄환 발사
- 4개의 방어막과 픽셀 단위 파괴 처리
- 25초 주기로 등장하는 UFO 보너스 적
- 적이 줄어들수록 이동 속도가 빨라지는 진행감
- 모든 적 제거 시 다음 스테이지 진행
- 스테이지마다 인베이더 이동 딜레이 10% 감소
- 스테이지 전환 시 방어막 복구
- Web Audio API 기반 효과음
- Supabase 기반 TOP 10 하이스코어 및 영문 이니셜 기록
- Supabase 미설정/오류 시 localStorage TOP 10 저장
- 키 바인딩 커스터마이징
- 6가지 컬러 테마
- 한국어/영어 UI 및 언어 토글
- 터치 입력 기기용 가상 버튼

## 기술 스택

- React 19
- TypeScript 5.9
- Phaser 3.90
- Vite 7
- Tauri 2
- Web Audio API
- ESLint 9

## 실행 방법

### 요구 사항

- Node.js 20 이상
- npm
- Rust stable toolchain
- Tauri 개발 환경

Tauri 앱 개발에 필요한 OS별 의존성은 Tauri 공식 문서를 기준으로 설치해야 합니다.

### 설치

```bash
npm install
```

### Supabase 하이스코어 설정

`.env.example`을 기준으로 `.env`를 만들고 Supabase URL, anon key를 설정합니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SCORE_TABLE=high_scores
```

Supabase SQL Editor에서 기본 테이블을 생성합니다.

```sql
create table if not exists public.high_scores (
  id bigint generated always as identity primary key,
  initials text not null check (initials ~ '^[A-Z-]{10}$'),
  score integer not null check (score > 0),
  created_at timestamptz not null default now()
);

create index if not exists high_scores_score_idx
  on public.high_scores (score desc, created_at asc);

alter table public.high_scores enable row level security;

create policy "Anyone can read high scores"
  on public.high_scores
  for select
  using (true);

create policy "Anyone can submit high scores"
  on public.high_scores
  for insert
  with check (initials ~ '^[A-Z-]{10}$' and score > 0);
```

### 브라우저 개발 서버

```bash
npm run dev
```

Vite 개발 서버가 기본적으로 `http://localhost:5173`에서 실행됩니다.

### Tauri 데스크톱 개발 모드

```bash
npm run tauri:dev
```

Tauri 설정은 `src-tauri/tauri.conf.json`에 있습니다. 개발 모드에서는 Tauri가 `npm run dev`를 먼저 실행하고 `http://localhost:5173`을 로드합니다.

### 빌드

```bash
npm run build
npm run tauri:build
```

- `npm run build`: TypeScript 빌드 후 Vite 정적 파일을 `dist/`에 생성합니다.
- `npm run tauri:build`: 프론트엔드 빌드 후 Tauri 데스크톱 번들을 생성합니다.

### 검사

```bash
npm run lint
```

## 게임 조작

### 기본 키

| 동작 | 기본 키 |
| --- | --- |
| 왼쪽 이동 | `←` |
| 오른쪽 이동 | `→` |
| 발사 | `SPACE` |
| 코인 투입 | `C` |
| 설정 화면 | `K` |

타이틀 화면에서 `C`로 코인을 넣은 뒤 `SPACE`를 눌러 게임을 시작합니다.

### 설정 화면

타이틀 화면에서 `K`를 누르면 설정 화면으로 이동합니다.

| 조작 | 기능 |
| --- | --- |
| `↑` / `↓` | 항목 선택 |
| `←` / `→` | 테마 변경 |
| `ENTER` | 키 변경, 테마 다음 항목 선택, 초기화 실행 |
| `ESC` | 키 변경 취소 또는 타이틀로 돌아가기 |

설정 가능한 키는 왼쪽 이동, 오른쪽 이동, 발사, 코인 투입입니다. 키 바인딩은 `spaceInvaders_keyBindings` localStorage 키에 저장됩니다.

### 터치 컨트롤

터치 입력 또는 coarse pointer 환경에서는 React 레이어가 가상 버튼을 표시합니다.

- 타이틀 화면: `COIN`, `START`
- 게임 화면: `LEFT`, `RIGHT`, `FIRE`

## 게임 규칙

### 점수

| 대상 | 점수 |
| --- | ---: |
| 오징어 | 30 |
| 게 | 20 |
| 문어 | 10 |
| UFO | 50, 100, 150, 200, 250, 300 중 무작위 |

### 스테이지

- 게임은 Stage 1부터 시작합니다.
- 모든 인베이더를 제거하면 다음 스테이지로 넘어갑니다.
- 스테이지가 올라갈 때마다 인베이더 기본 이동 딜레이가 `0.9^(stage - 1)` 배율로 감소합니다.
- 새 스테이지 시작 시 방어막이 모두 다시 생성됩니다.

### 게임 오버

- 플레이어 목숨이 0이 되면 게임 오버입니다.
- 인베이더가 플레이어 근처 하단까지 내려오면 즉시 게임 오버입니다.
- TOP 10에 들어가는 점수면 영문 이름/이니셜을 최대 10자까지 입력해 하이스코어에 등록합니다.
- TOP 10에 들지 못하면 3초 뒤 타이틀 화면으로 돌아갑니다.

## 테마와 언어

### 컬러 테마

설정 화면에서 다음 테마를 선택할 수 있습니다.

- Classic
- Neon
- Retro
- Ocean
- Sunset
- Matrix

선택한 테마는 `spaceInvaders_theme` localStorage 키에 저장됩니다.

### 언어

지원 언어는 영어와 한국어입니다.

- 최초 실행 시 브라우저 언어가 `ko`로 시작하면 한국어를 사용합니다.
- 게임 화면이 아닐 때 하단의 `EN` / `KO` 버튼으로 언어를 전환할 수 있습니다.
- 언어 선택은 현재 세션 상태로 관리되며 localStorage에는 저장하지 않습니다.

## 프로젝트 구조

```text
invader/
├── public/
│   └── vite.svg
├── src/
│   ├── App.tsx                         # React 앱, 언어 토글, 터치 컨트롤
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── game/
│       ├── index.ts                    # Phaser 게임 생성/정리
│       ├── config.ts                   # Phaser 설정, 800x600 캔버스
│       ├── audio/
│       │   └── SoundManager.ts         # Web Audio API 효과음
│       ├── i18n/
│       │   └── Localization.ts         # 한국어/영어 문자열
│       ├── input/
│       │   └── VirtualControls.ts      # 터치 버튼 입력 큐
│       ├── score/
│       │   └── ScoreManager.ts         # 최근 점수/TOP 10 저장
│       ├── scenes/
│       │   ├── TitleScene.ts           # 타이틀, 코인/시작, 점수 표시
│       │   ├── GameScene.ts            # 메인 게임 로직
│       │   └── SettingsScene.ts        # 키 바인딩과 테마 설정
│       ├── settings/
│       │   ├── KeyBindingManager.ts    # 키 바인딩 localStorage 관리
│       │   └── ThemeManager.ts         # 컬러 테마 localStorage 관리
│       └── sprites/
│           ├── PixelSprites.ts         # 픽셀 스프라이트 생성
│           └── Shelter.ts              # 방어막 픽셀 파괴 로직
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── icons/
│   ├── capabilities/
│   │   └── default.json
│   ├── Cargo.toml
│   └── tauri.conf.json                 # Tauri 앱/번들 설정
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Tauri 앱 설정

- 제품명: `inavader`
- 앱 식별자: `com.invader.game`
- 앱 버전: `0.1.0`
- 창 제목: `Space Invaders`
- 창 크기: `900 x 750`
- 리사이즈: 비활성화
- 번들 대상: `all`

## 저장 데이터

브라우저와 Tauri WebView의 localStorage를 사용합니다.

| 키 | 내용 |
| --- | --- |
| `spaceInvaders_keyBindings` | 사용자 키 바인딩 |
| `spaceInvaders_theme` | 선택한 컬러 테마 |
| `spaceInvaders_recentScore` | 최근 게임 점수 |
| `spaceInvaders_topScores` | Supabase 실패 시 사용할 TOP 10 점수 목록 |

## 라이선스와 크레딧

MIT License

이 프로젝트는 1978년 Taito Corporation의 원작 Space Invaders에 대한 오마주로 제작된 재구현입니다.
