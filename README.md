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

create policy "allow classroom insert"
on privacy_logs
for insert
to anon
with check (student_no between 1 and 12);

create policy "allow classroom read"
on privacy_logs
for select
to anon
using (true);

create policy "allow classroom delete"
on privacy_logs
for delete
to anon
using (true);
```

## Supabase 연결

`supabase-config.js` 파일에 Supabase 값을 넣습니다.

```js
window.SUPABASE_CONFIG = {
  url: "https://프로젝트아이디.supabase.co",
  anonKey: "Supabase anon public key",
  teacherPassword: "1234"
};
```

## Vercel 배포

이 폴더 전체를 GitHub 저장소에 올린 뒤 Vercel에서 Import하면 됩니다.

필수 파일:

- `index.html`
- `styles.css`
- `app.js`
- `supabase-config.js`

## 주의

이 앱은 수업 체험용입니다. 실제 이름, 전화번호, 주소, 학교명을 입력하게 하지 마세요.
