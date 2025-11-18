# Trippin App 🇯🇵

旅行プランニングと管理のためのモダンなWebアプリケーション

## 🚀 特徴

- ✈️ 旅行プランニングと管理
- 🌍 多言語対応（13言語）
- 🔐 Auth0認証システム
- 💳 Stripe決済統合
- 📱 PWA対応
- 🎨 モダンなUI/UX（Tailwind CSS + Framer Motion）

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **認証**: Auth0
- **決済**: Stripe
- **デプロイ**: Vercel
- **バックエンド**: Vercel Functions

## 📦 インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 🌐 Vercel デプロイメント

このプロジェクトはVercel用に最適化されています。

### クイックデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hk493/goon)

### 手動デプロイ

1. [Vercel](https://vercel.com)にログイン
2. "New Project"をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定
5. デプロイ

詳細な手順は[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)を参照してください。

## 🔧 環境変数

`.env.example`ファイルを参考に、以下の環境変数を設定してください：

```bash
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_CALLBACK_URL=https://letsgettrippin.jp/callback
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
VITE_API_BASE_URL=https://letsgettrippin.jp/api
OPENAI_API_KEY=your-openai-api-key
```

## 📱 PWA機能

- オフライン対応
- ホーム画面への追加
- プッシュ通知
- バックグラウンド同期

## 🌍 多言語対応

以下の言語をサポート：
- 日本語 (ja)
- 英語 (en)
- スペイン語 (es)
- フランス語 (fr)
- ドイツ語 (de)
- 中国語 (zh)
- 韓国語 (ko)
- その他

## 🚀 開発

```bash
# リンターの実行
npm run lint

# 型チェック
npm run type-check

# テスト（実装予定）
npm run test
```

## 📁 プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
├── pages/              # ページコンポーネント
├── contexts/           # React Context
├── hooks/              # カスタムフック
├── i18n/               # 国際化設定
├── utils/              # ユーティリティ関数
└── config/             # 設定ファイル
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題が発生した場合や質問がある場合は、[Issues](../../issues)を作成してください。

## 🔗 リンク

- [ライブデモ](https://letsgettrippin.jp)
- [ドキュメント](https://letsgettrippin.jp/docs)
- [API リファレンス](https://letsgettrippin.jp/api)
