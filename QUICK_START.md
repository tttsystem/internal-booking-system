# 🚀 クイックスタートガイド

## 即座に動かす手順

### 1. ローカル開発環境
```bash
cd C:\Users\PC01\Documents\internal-booking-system
npm install
npm start
```
→ http://localhost:3000 でアクセス

### 2. 本番デプロイ（Netlify）
1. GitHubリポジトリ作成してプッシュ
2. Netlifyでサイト作成（GitHub連携）
3. 環境変数設定: `NOTION_TOKEN`
4. 自動デプロイ完了

### 3. 必要な設定
- **Notion Integration Token**: 既存のものを使用
- **データベースID**: `1f344ae2d2c7804994e3ec2a11bb3f79`
- **プロパティ**: 予定名、日付、担当、ユーザー

## ⚡ 重要ポイント

✅ **営業時間**: 9:00-22:00（平日のみ）  
✅ **データベース**: 既に正しいIDで設定済み  
✅ **API**: 3つのNetlify Functions完備  
✅ **デザイン**: モダンなグラスモーフィズムUI  
✅ **ユーザー選択**: Notionワークスペースから自動取得  

## 🔧 Claude Codeでの編集

新しいClaude Codeセッションで以下を実行：

```
C:\Users\PC01\Documents\internal-booking-system にある
サブスク事業部予定表を確認してください。

CLAUDE_CODE_GUIDE.md を読んで、このプロジェクトの概要を教えてください。
```

---

*詳細は SETUP_INSTRUCTIONS.md を参照*