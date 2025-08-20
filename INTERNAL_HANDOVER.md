# 🔐 社内引き継ぎ用 - 設定値一覧

## 即座に使える設定値

### Notion API設定
```
NOTION_TOKEN=secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG
```

### データベース設定
```
CALENDAR_DATABASE_ID=1f344ae2d2c7804994e3ec2a11bb3f79
```

### 対応者ID（既存システムと同じ）
```
USER_ID=1ffd872b-594c-8107-b306-000269021f07
```

## 🚀 即座にデプロイする手順

### 1. Netlify環境変数設定
```
NOTION_TOKEN=secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG
```

### 2. ローカル開発用 (.env.local)
```
NOTION_TOKEN=secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG
```

### 3. 直接コードに書く場合
`src/components/InternalBookingSystem.jsx`の各Fetch呼び出しで：

```javascript
headers: {
  'Authorization': 'Bearer secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG',
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
}
```

## 📋 Claude Codeへの指示例

```
C:\Users\PC01\Documents\internal-booking-system の
サブスク事業部予定表システムを確認してください。

INTERNAL_HANDOVER.md にある設定値を使って、
すぐに動作するように設定してください。

NOTION_TOKEN: secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG
データベースID: 1f344ae2d2c7804994e3ec2a11bb3f79

npm start で起動確認をお願いします。
```

## ⚡ 重要な設定値まとめ

| 項目 | 値 |
|------|-----|
| Notion Token | `secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG` |
| データベースID | `1f344ae2d2c7804994e3ec2a11bb3f79` |
| API Version | `2022-06-28` |
| 営業時間 | 9:00-22:00 |
| 営業日 | 平日のみ |

---

*⚠️ このファイルには機密情報が含まれています。社内のみで使用してください。*