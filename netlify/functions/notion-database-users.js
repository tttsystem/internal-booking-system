exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { databaseId } = JSON.parse(event.body);
    
    // 全期間のレコードを取得
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (data.object === 'error') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(data)
      };
    }

    // 全期間のレコードからユーザーを抽出
    const userMap = new Map();
    
    console.log('レコード数:', data.results?.length || 0);
    
    if (data.results) {
      data.results.forEach((record, index) => {
        console.log(`レコード ${index}:`, record.properties);
        
        // 複数のプロパティ名を試す
        const possibleUserProps = ['ユーザー', '担当', 'User', 'Assigned', '責任者'];
        let userProp = null;
        
        for (const propName of possibleUserProps) {
          if (record.properties[propName]) {
            userProp = record.properties[propName];
            console.log(`Found user property: ${propName}`, userProp);
            break;
          }
        }
        
        if (userProp && userProp.people) {
          userProp.people.forEach(user => {
            console.log('Found user:', user.name);
            if (!userMap.has(user.id)) {
              userMap.set(user.id, {
                id: user.id,
                name: user.name,
                avatar_url: user.avatar_url,
                type: user.type,
                person: user.person
              });
            }
          });
        }
      });
    }
    
    const users = Array.from(userMap.values());
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        object: 'list',
        results: users,
        has_more: false
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};