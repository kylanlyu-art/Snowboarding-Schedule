# Supabase 集成说明

## 1. 执行 SQL

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目 → **SQL Editor**
2. 复制 `schema.sql` 中的全部内容并执行（创建 `events` 表与 RLS）

## 2. 环境变量

- **本地**：复制 `.env.example` 为 `.env.local`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- **Vercel**：Project → Settings → Environment Variables 中添加上述两个变量

URL 与 anon key 在 Supabase 项目 **Settings → API** 中查看。

## 3. 前端使用

- `src/lib/supabase.ts`：创建 Supabase 客户端（未配置时 `supabase` 为 `null`）
- `src/hooks/useEvents.ts`：`useEvents()` 返回 `{ events, loading, userId, addEvent, updateEvent, deleteEvent, refresh }`  
  - 需先通过 `supabase.auth.signInWithPassword()` 等完成登录后，`userId` 才有值，`events` 才会按当前用户拉取

## 4. 数据迁移（本地 → 云端）

若本地已有 IndexedDB 课表数据，可在用户**首次登录 Supabase 后**做一次性迁移：

1. 调用现有 `getAllEvents()`（IndexedDB）得到本地事件列表
2. 获取当前用户：`const { data: { user } } = await supabase.auth.getUser()`
3. 将每条事件转为 Supabase 的 `events` 行格式（含 `user_id`），`insert` 到 Supabase
4. 可选：在 localStorage 写入迁移标记（如 `ski-schedule-migrated-to-supabase: true`），避免重复迁移
5. 可选：迁移成功后清空本地事件表，或保留为离线备份

之后前端可改为使用 `useEvents()` 的数据与增删改，实现云端同步。
