# サブスク事業部予定表

社内向けの予約システムです。NotionデータベースとAPI連携して予定を管理します。

## 機能

- **日時選択**: 平日（月-金）の9:00-22:00の時間枠で予約可能
- **担当者選択**: Notionユーザーから担当者を選択
- **予定管理**: 予定名、日付、担当者、ユーザーをNotionデータベースに保存
- **重複チェック**: 既存の予約との重複を自動チェック
- **土日祝日除外**: 土日祝日は自動的に予約不可

## セットアップ

### 必要な環境変数（Netlify）

```
NOTION_TOKEN=your_notion_integration_token
```

### Notionデータベースのプロパティ

- **予定名** (タイトル)
- **日付** (日付)
- **担当** (ユーザー)
- **ユーザー** (ユーザー)

### データベースID

`1f344ae2d2c7804994e3ec2a11bb3f79`

## 開発

```bash
npm start
```

アプリが http://localhost:3000 で起動します。

## ビルド

```bash
npm run build
```

## デプロイ

Netlifyにデプロイする際は、環境変数`NOTION_TOKEN`を設定してください。

## 特徴

- モダンなUI/UX（Tailwind CSS使用）
- グラスモーフィズムデザイン
- レスポンシブ対応
- アニメーション効果
- 土日祝日の自動除外
- リアルタイムの空き状況表示

---

## Create React App について

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.