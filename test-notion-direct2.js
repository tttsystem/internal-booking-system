// トークンの別の形式をテスト
const fetch = require('node-fetch');

// トークンのバリエーションをテスト
const tokens = [
  'secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG', // 元の形式
  'secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG', // 同じ（スペースなし確認）
];

const DATABASE_ID = '1f344ae2d2c7804994e3ec2a11bb3f79';

async function testToken(token, label) {
  console.log(`\n=== テスト: ${label} ===`);
  console.log('Token length:', token.length);
  console.log('Token prefix:', token.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://api.notion.com/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      }
    });
    
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✓ 成功! ユーザー数:', data.results?.length || 0);
      
      // 成功したら、データベースもテスト
      const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({})
      });
      
      const dbData = await dbResponse.json();
      if (dbResponse.status === 200) {
        console.log('✓ データベースアクセス成功! 結果:', dbData.results?.length || 0);
      } else {
        console.log('✗ データベースアクセス失敗:', dbData);
      }
      
    } else {
      console.log('✗ 失敗:', data);
    }
  } catch (error) {
    console.log('✗ エラー:', error.message);
  }
}

async function main() {
  for (let i = 0; i < tokens.length; i++) {
    await testToken(tokens[i], `トークン ${i + 1}`);
  }
  
  // サイトのAPIエンドポイントをテスト
  console.log('\n=== Netlifyファンクションテスト ===');
  try {
    const response = await fetch('https://subscription-yotei.netlify.app/.netlify/functions/notion-users');
    const data = await response.json();
    console.log('Netlify関数のレスポンス:', data);
  } catch (error) {
    console.log('Netlify関数エラー:', error.message);
  }
}

main();