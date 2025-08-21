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

    // データベースから全レコードを取得してユーザー情報を収集
    let allRecords = [];
    let hasMore = true;
    let nextCursor = undefined;
    
    // ページネーションで全レコードを取得
    while (hasMore) {
      const queryBody = {
        page_size: 100
      };
      if (nextCursor) {
        queryBody.start_cursor = nextCursor;
      }
      
      const queryResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(queryBody)
      });

      const queryData = await queryResponse.json();
      
      if (queryData.object === 'error') {
        break;
      }
      
      if (queryData.results) {
        allRecords = allRecords.concat(queryData.results);
      }
      
      hasMore = queryData.has_more;
      nextCursor = queryData.next_cursor;
    }
    
    // 全レコードからユーザー情報を抽出
    const userMap = new Map();
    
    allRecords.forEach(record => {
      // 複数のプロパティからユーザーを検索
      const possibleUserProps = ['ユーザー', '担当', 'User', 'Assignee', 'People'];
      
      possibleUserProps.forEach(propName => {
        const userProp = record.properties[propName];
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
    });
    
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
        has_more: false,
        total_records: allRecords.length,
        total_users: users.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};