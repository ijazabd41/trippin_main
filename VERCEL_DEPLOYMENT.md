# Vercel デプロイメントガイド

## 前提条件

- Vercelアカウント
- GitHub/GitLab/Bitbucketアカウント
- Node.js 18.x以上

## デプロイメント手順

### 1. プロジェクトの準備

```bash
# 依存関係のインストール
npm install

# ビルドテスト
npm run build
```

### 2. Vercelへの接続

1. [Vercel](https://vercel.com)にログイン
2. "New Project"をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を設定

### 3. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

#### 本番環境
```
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_CALLBACK_URL=https://your-app.vercel.app/callback
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
VITE_API_BASE_URL=https://your-app.vercel.app/api
OPENAI_API_KEY=your-openai-api-key
```

#### プレビュー環境
```
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_CALLBACK_URL=https://your-app.vercel.app/callback
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
VITE_API_BASE_URL=https://your-app.vercel.app/api
OPENAI_API_KEY=your-openai-api-key
```

### 4. ビルド設定

Vercelは自動的に以下を検出します：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. カスタムドメインの設定（オプション）

1. Vercelダッシュボードで"Settings" → "Domains"
2. カスタムドメインを追加
3. DNSレコードを設定

### 6. デプロイメント

- メインブランチへのプッシュで自動デプロイ
- プルリクエストでプレビューデプロイ

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドテスト
npm run build

# 依存関係の確認
npm ls
```

### 環境変数エラー

- Vercelダッシュボードで環境変数が正しく設定されているか確認
- 環境変数名が`VITE_`で始まっているか確認

### ルーティングエラー

- `vercel.json`の`rewrites`設定を確認
- SPAルーティングが正しく動作しているか確認

## パフォーマンス最適化

### 画像最適化

```typescript
// next/imageの代わりにViteの最適化を使用
import.meta.url
```

### コード分割

```typescript
// 動的インポートを使用
const LazyComponent = lazy(() => import('./LazyComponent'))
```

### キャッシュ戦略

- 静的アセットは長期キャッシュ
- APIレスポンスは適切なキャッシュヘッダー

## 監視と分析

- Vercel Analyticsの有効化
- パフォーマンスメトリクスの監視
- エラー追跡の設定

## セキュリティ

- 環境変数の適切な管理
- HTTPSの強制
- セキュリティヘッダーの設定
- CSP（Content Security Policy）の実装
