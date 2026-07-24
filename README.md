# Demo Budget Book

家計簿（収入・支出）を月単位で記録・閲覧できるデモアプリです。
バックエンドは FastAPI + MySQL、フロントエンドは Next.js で構成されています。

このデモ版は「入力できる値の種類」自体をあらかじめ決まった選択肢に制限しています（金額は固定の候補値のみ、対象月は2026年2〜7月のみ、カテゴリ名も固定リストのみ）。これにより、誰かが実際の個人情報（本物の家賃や給料の金額など）を入力しても、それと分からない・実用に足る精度で推測できない形になっています。

## 構成

- `backend/` — FastAPI製API（MySQLに接続）
- `frontend/` — Next.js製フロントエンド

## セットアップ

### 前提

- Python 3.11+
- Node.js 20+
- MySQL 8系（ローカルで起動していること）

### 1. データベースを作成する

MySQLに接続し、空のデータベースを1つ作成します（テーブルはアプリ起動時に自動作成されます）。

```sql
CREATE DATABASE in_out;
```

### 2. バックエンド

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # Windows / PowerShell: Copy-Item .env.example .env
```

`.env` を開き、自分の環境のMySQL接続情報（`DB_USER` / `DB_PASSWORD` など）を入力してください。
`.env` はGit管理対象外（`.gitignore`済み）なので、ここに書いたパスワードがリポジトリに含まれることはありません。

リポジトリのルート（`backend/` の一つ上）から起動します。

```bash
python -m uvicorn backend.main:app --reload
```

`http://127.0.0.1:8000` で起動します。初回起動時に必要なテーブル（`categories` / `budget`）が自動作成されます。

デモ用のダミーデータを投入したい場合は以下を実行してください（既存データは削除されて再生成されます）。

```bash
python -m backend.scripts.reset_demo
```

### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:3000` で起動します。
