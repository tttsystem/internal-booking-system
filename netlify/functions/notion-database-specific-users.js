exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { databaseId } = JSON.parse(event.body);
    
    // データベースの詳細情報を取得
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      }
    });

    const dbData = await dbResponse.json();
    
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

    // 手動で特定のユーザーリストを定義（そのデータベースに関係する人のみ）
    // このリストは実際のデータベースURLから確認した参加者を基に作成
    const specificUsers = [
      { id: 'user1', name: '橋岡' },
      { id: 'user2', name: '加藤' },
      { id: 'user3', name: '川合' },
      { id: 'user4', name: '山本' },
      { id: 'user5', name: '酒匂' },
      { id: 'user6', name: '北澤' }
    ];

    // ワークスペースの全ユーザーを取得
    const usersResponse = await fetch('https://api.notion.com/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      }
    });
    
    const usersData = await usersResponse.json();
    const allUsers = usersData.results || [];
    
    // 名前でマッチングして実際のユーザー情報を取得
    const matchedUsers = [];
    const userNameList = allUsers.map(u => u.name);
    
    allUsers.forEach(user => {
      if (user.type === 'person') {
        // 特定の名前が含まれているかチェック
        const isSpecificUser = specificUsers.some(specificUser => 
          user.name.includes(specificUser.name) || specificUser.name.includes(user.name)
        );
        
        if (isSpecificUser) {
          matchedUsers.push({
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            type: user.type,
            person: user.person
          });
        }
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        object: 'list',
        results: matchedUsers,
        has_more: false,
        debug: {
          allUserNames: userNameList,
          specificNames: specificUsers.map(u => u.name),
          matchedNames: matchedUsers.map(u => u.name)
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};