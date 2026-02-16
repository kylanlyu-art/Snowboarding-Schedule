-- 滑雪教练课表管理系统 - Supabase 表结构与 RLS
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1) 事件表（课表：课程/练活/培训等）
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('课程', '试课', '练活', '培训')),
  date          date not null,
  time_slot     text not null check (time_slot in ('上午', '下午', '夜场', '全天')),
  start_time    text not null,
  end_time      text not null,
  duration      numeric(4,1) not null default 3,
  title         text not null,
  venue         text,
  fee           numeric(10,2),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.events is '课表事件：课程、练活、培训等';
create index if not exists idx_events_user_date on public.events(user_id, date);
create index if not exists idx_events_user on public.events(user_id);

-- 更新 updated_at 触发器
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- 2) RLS：用户只能操作自己的事件
alter table public.events enable row level security;

create policy "用户读取自己的事件"
  on public.events for select
  using (auth.uid() = user_id);

create policy "用户创建自己的事件"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "用户更新自己的事件"
  on public.events for update
  using (auth.uid() = user_id);

create policy "用户删除自己的事件"
  on public.events for delete
  using (auth.uid() = user_id);
