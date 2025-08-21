// 直接Notion APIをテストして権限を確認
const fetch = require('node-fetch');

const NOTION_TOKEN = 'secret_TYiWCjqURBKUDVWxBvQYeibrcfQFYJa2H12VbzRwDXXL1bG';
const DATABASE_ID = '1f344ae2d2c7804994e3ec2a11bb3f79';

async function testNotionAccess() {
  console.log('=== Notion API 直接テスト ===');
  console.log('Database ID:', DATABASE_ID);
  console.log('Token prefix:', NOTION_TOKEN.substring(0, 20) + '...');
  
  // 1. ユーザーAPIテスト（これは成功するはず）
  console.log('\n1. ユーザーAPI テスト:');
  try {
    const userResponse = await fetch('https://api.notion.com/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      }
    });
    const userData = await userResponse.json();
    console.log('  ステータス:', userResponse.status);
    if (userResponse.status === 200) {
      console.log('  ✓ ユーザー数:', userData.results ? userData.results.length : 0);
    } else {
      console.log('  ✗ エラー:', userData);
    }
  } catch (error) {
    console.log('  ✗ エラー:', error.message);
  }

  // 2. データベース情報取得テスト
  console.log('\n2. データベース情報取得テスト:');
  try {
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      }
    });
    const dbData = await dbResponse.json();
    console.log('  ステータス:', dbResponse.status);
    if (dbResponse.status === 200) {
      console.log('  ✓ データベース名:', dbData.title?.[0]?.plain_text || 'N/A');
      console.log('  プロパティ:', Object.keys(dbData.properties || {}).join(', '));
    } else {
      console.log('  ✗ エラー:', dbData);
    }
  } catch (error) {
    console.log('  ✗ エラー:', error.message);
  }

  // 3. データベースクエリテスト
  console.log('\n3. データベースクエリテスト:');
  try {
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({})
    });
    const queryData = await queryResponse.json();
    console.log('  ステータス:', queryResponse.status);
    if (queryResponse.status === 200) {
      console.log('  ✓ 結果数:', queryData.results ? queryData.results.length : 0);
    } else {
      console.log('  ✗ エラー:', queryData);
    }
  } catch (error) {
    console.log('  ✗ エラー:', error.message);
  }

  // 4. ワークスペース情報の検索
  console.log('\n4. ワークスペース内のデータベース検索:');
  try {
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        }
      })
    });
    const searchData = await searchResponse.json();
    console.log('  ステータス:', searchResponse.status);
    if (searchResponse.status === 200) {
      console.log('  アクセス可能なデータベース:');
      searchData.results?.forEach(db => {
        const dbId = db.id.replace(/-/g, '');
        console.log(`    - ${db.title?.[0]?.plain_text || 'Untitled'} (${dbId})`);
        if (dbId === DATABASE_ID) {
          console.log('      ↑ これが目的のデータベースです！');
        }
      });
    } else {
      console.log('  ✗ エラー:', searchData);
    }
  } catch (error) {
    console.log('  ✗ エラー:', error.message);
  }
}

testNotionAccess();