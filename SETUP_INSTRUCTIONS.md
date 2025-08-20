# サブスク事業部予定表 - セットアップ・運用指示書

## 📋 システム概要

このシステムは社内専用の予約システムです。Notionデータベースと連携して、サブスク事業部のメンバーが会議や予定を効率的に管理できます。

### 基本仕様
- **システム名**: サブスク事業部予定表
- **対象**: 社内メンバーのみ
- **営業時間**: 平日 9:00-22:00（土日祝日は自動除外）
- **予約単位**: 1時間

## 🗄️ Notionデータベース設定

### データベースID
```
1f344ae2d2c7804994e3ec2a11bb3f79
```

### 必要なプロパティ
| プロパティ名 | 型 | 説明 |
|-------------|-----|------|
| 予定名 | タイトル | 会議名やイベント名（必須） |
| 日付 | 日付 | 予定の開始・終了時刻（必須） |
| 担当 | ユーザー | 担当者（必須） |
| ユーザー | ユーザー | 同じ担当者が自動設定（必須） |

### Integration設定
1. https://www.notion.so/my-integrations にアクセス
2. 既存のIntegrationを使用（新規作成の場合は下記手順）
3. データベースに接続権限を付与

## 🚀 デプロイ手順

### 1. Netlifyでのデプロイ

#### Gitリポジトリの準備
```bash
cd C:\Users\PC01\Documents\internal-booking-system
git remote add origin [GitHubリポジトリURL]
git push -u origin master
```

#### Netlifyサイト作成
1. https://app.netlify.com にログイン
2. 「New site from Git」をクリック
3. GitHubリポジトリを選択
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`

#### 環境変数設定
Netlifyサイトの「Site settings」→「Environment variables」で以下を追加：

```
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. ローカル開発環境

#### 初回セットアップ
```bash
cd C:\Users\PC01\Documents\internal-booking-system
npm install
npm start
```

#### 環境変数（ローカル用）
`.env.local`ファイルを作成：
```
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 👥 ユーザー管理

### Notionワークスペースのユーザー
- システムは自動的にNotionワークスペースのユーザー一覧を取得
- 「担当者」として選択可能なのは`type: "person"`のユーザーのみ
- ボットやゲストユーザーは除外

### ユーザー表示名の優先順位
1. `user.name`
2. `user.person.email`
3. "Unknown User"

## 🔧 カスタマイズ

### 営業時間の変更
`src/components/InternalBookingSystem.jsx`の20-24行目：
```javascript
const settings = {
  startHour: 9,     // 開始時間（9時）
  endHour: 22,      // 終了時間（22時）
  systemTitle: 'サブスク事業部予定表',
  description: 'ご希望の日時を選択してください'
};
```

### 祝日の更新
27-32行目の`holidays2025`配列に祝日を追加：
```javascript
const holidays2025 = [
  '2025-01-01', '2025-01-13', // ... 追加の祝日
];
```

### データベースIDの変更
35行目：
```javascript
const CALENDAR_DATABASE_ID = '新しいデータベースID';
```

## 📱 使用方法

### 管理者向け
1. **予約状況確認**: Notionデータベースで全体の予約状況を確認
2. **ユーザー管理**: Notionワークスペースでユーザーの追加・削除
3. **カレンダー管理**: Notionカレンダービューで視覚的に確認

### 利用者向け
1. **アクセス**: 社内URLにアクセス
2. **日時選択**: 平日の空き時間から選択
3. **予定入力**: 
   - 予定名を入力（必須）
   - 担当者を選択（必須）
4. **予約確定**: 内容確認後、予約確定ボタンをクリック

## 🚨 トラブルシューティング

### よくある問題

#### 1. 予約が作成されない
**原因と解決方法:**
- Notion Tokenが正しく設定されているか確認
- データベースIDが正しいか確認
- Integrationがデータベースに接続されているか確認

#### 2. ユーザー一覧が表示されない
**原因と解決方法:**
- Notion Tokenの権限を確認
- ワークスペースにユーザーが存在するか確認
- ブラウザのコンソールでエラーを確認

#### 3. 時間帯が重複してブロックされない
**原因と解決方法:**
- ブラウザのコンソールでエラーを確認
- Notionデータベースの「日付」プロパティが正しく設定されているか確認

#### 4. ローカル開発でAPIエラー
**原因と解決方法:**
```bash
# Netlify CLIを使用してローカルでFunctionsをテスト
npm install -g netlify-cli
netlify dev
```

### エラーログの確認方法
1. **ブラウザ**: F12キー → Consoleタブ
2. **Netlify**: サイト管理画面 → Functions → ログ確認
3. **ローカル**: ターミナルの出力確認

## 🔒 セキュリティ注意事項

### 重要な注意点
- **Notion Token**は絶対に公開しない
- GitHubにトークンをコミットしないよう注意
- 本番環境では必ずHTTPS経由でアクセス
- 定期的にトークンを更新することを推奨

### アクセス制御
- 社内ネットワークからのみアクセス可能に設定することを推奨
- Netlify の「Access control」機能の活用を検討

## 📊 運用・監視

### 定期的なメンテナンス
- **月次**: 祝日リストの更新確認
- **四半期**: Notion Tokenの更新検討
- **半年**: ユーザー一覧の整理

### パフォーマンス監視
- Netlify Analytics でアクセス状況を確認
- Function の実行時間やエラー率を監視

## 🆘 サポート・連絡先

### 技術的な問題
- 開発担当者に連絡
- GitHubのIssuesに問題を記録

### 運用に関する問題
- サブスク事業部の管理者に連絡
- Notion管理者に相談

## 📝 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-01-20 | 1.0.0 | 初回リリース |

---

## 📋 チェックリスト

### デプロイ前確認
- [ ] Notionデータベースのプロパティが正しく設定されている
- [ ] Integrationがデータベースにアクセスできる
- [ ] 環境変数NOTION_TOKENが設定されている
- [ ] Netlify Functionsがデプロイされている

### 動作確認
- [ ] ローカル環境で正常に動作する
- [ ] ユーザー一覧が正しく取得できる
- [ ] 予約作成が正常に動作する
- [ ] 既存予約との重複チェックが動作する
- [ ] 土日祝日が正しく除外される

### セキュリティ確認
- [ ] Notion Tokenが公開されていない
- [ ] 本番環境でHTTPS接続されている
- [ ] アクセス制御が適切に設定されている

---

*最終更新: 2025年1月*