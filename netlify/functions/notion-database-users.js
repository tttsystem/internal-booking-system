exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { databaseId } = JSON.parse(event.body);
    
    // 今週の日付範囲を計算
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 月曜日
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 日曜日
    
    // 今週のレコードを取得
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: '日付',
          date: {
            on_or_after: startOfWeek.toISOString().split('T')[0],
            on_or_before: endOfWeek.toISOString().split('T')[0]
          }
        }
      })
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

    // 今週のレコードからユーザーを抽出
    const userMap = new Map();
    
    if (data.results) {
      data.results.forEach(record => {
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