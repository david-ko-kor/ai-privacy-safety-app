# AI 개인정보 안전 체험 앱

발달장애 고1 학생을 위한 생성형 AI 개인정보 안전 체험 앱입니다.

## 수업 흐름

1. 학생이 1번부터 12번 중 자기 번호를 고릅니다.
2. 가짜 개인정보 예시 또는 안전한 문장을 고릅니다.
3. `AI에게 보내기 체험`을 누릅니다.
4. 선생님 화면에서 1~12번 참여 현황을 확인합니다.

실제 개인정보는 저장하지 않습니다. 저장되는 값은 학생번호, 정보 종류, 위험도, 시간뿐입니다.

## Supabase 테이블 만들기

Supabase SQL Editor에서 아래 SQL을 실행하세요.

```sql
create table privacy_logs (
  id uuid primary key default gen_random_uuid(),
  student_no int not null check (student_no between 1 and 12),
  info_type text not null,
  risk_level text not null,
  created_at timestamptz not null default now()
);

alter table privacy_logs enable row level security;
```

데이터 읽기/쓰기/삭제는 Vercel 서버 함수가 `service role` 권한으로 처리합니다. 브라우저에는 Supabase 비밀키를 넣지 않습니다.

이미 공개 정책을 만들었다면 SQL Editor에서 아래를 실행해 지워도 됩니다.

```sql
drop policy if exists "allow classroom insert" on privacy_logs;
drop policy if exists "allow classroom read" on privacy_logs;
drop policy if exists "allow classroom delete" on privacy_logs;
```

## Vercel 환경변수

Vercel 프로젝트의 `Settings` → `Environment Variables`에 아래 3개를 넣습니다.

```text
SUPABASE_URL=https://프로젝트아이디.supabase.co
SUPABASE_SERVICE_ROLE_KEY=Supabase Secret key 또는 service_role key
TEACHER_PASSWORD=선생님 화면 비밀번호
```

주의: `SUPABASE_SERVICE_ROLE_KEY`는 Vercel 환경변수에만 넣습니다. `supabase-config.js`나 브라우저 코드에 넣으면 안 됩니다.

## Vercel 배포

이 폴더 전체를 GitHub 저장소에 올린 뒤 Vercel에서 Import하면 됩니다.

필수 파일:

- `index.html`
- `styles.css`
- `app.js`
- `supabase-config.js`
- `api/` 폴더

## 주의

이 앱은 수업 체험용입니다. 실제 이름, 전화번호, 주소, 학교명을 입력하게 하지 마세요.
