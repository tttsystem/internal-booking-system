exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { databaseId } = JSON.parse(event.body);
    
    // データベースの情報を取得してユーザープロパティから参加者を抽出
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      }
    });

    const dbData = await response.json();
    
    if (dbData.object === 'error') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(dbData)
      };
    }

    // ユーザープロパティから参加者を取得
    const userProperty = dbData.properties['ユーザー'] || dbData.properties['担当'];
    
    let users = [];
    if (userProperty && userProperty.type === 'people') {
      // データベースから実際のレコードを取得してユーザー情報を収集
      const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({})
      });

      const queryData = await queryResponse.json();
      
      if (queryData.results) {
        const userMap = new Map();
        
        queryData.results.forEach(record => {
          const userProp = record.properties['ユーザー'] || record.properties['担当'];
          if (userProp && userProp.people) {
            userProp.people.forEach(user => {
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
        
        users = Array.from(userMap.values());
      }
    }
    
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