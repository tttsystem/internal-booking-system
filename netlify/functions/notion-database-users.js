exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { databaseId, viewId } = JSON.parse(event.body);
    
    console.log('Database ID:', databaseId);
    console.log('View ID:', viewId);
    
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
    
    // レコードからユーザーIDを取得し、ワークスペースAPIで詳細を補完
    const recordUserIds = new Set();
    const userMap = new Map();
    
    // まずワークスペースの全ユーザー情報を取得
    const usersResponse = await fetch('https://api.notion.com/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      }
    });
    
    const usersData = await usersResponse.json();
    const allWorkspaceUsers = new Map();
    
    if (usersData.results) {
      usersData.results.forEach(user => {
        if (user.type === 'person') {
          allWorkspaceUsers.set(user.id, {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            type: user.type,
            person: user.person
          });
        }
      });
    }

    // 全期間のレコードを取得
    let allRecords = [];
    let hasMore = true;
    let nextCursor = undefined;
    
    // 全レコードを取得
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
    
    // データベースのレコードからもユーザーを抽出(以前に作った人)
    const debugInfo = {
      totalRecords: allRecords.length,
      foundProperties: new Set(),
      allUserNames: [],
      recordUsers: [],
      workspaceUsers: Array.from(userMap.values()).map(u => u.name),
      sampleRecords: allRecords.slice(0, 3).map(r => ({
        id: r.id,
        properties: Object.keys(r.properties)
      }))
    };
    
    allRecords.forEach((record, recordIndex) => {
      // 複数のプロパティからユーザーを検索
      const possibleUserProps = ['ユーザー', '担当', 'User', 'Assignee', 'People', 'メンバー', 'Member'];
      
      possibleUserProps.forEach(propName => {
        const userProp = record.properties[propName];
        if (userProp) {
          debugInfo.foundProperties.add(`${propName} (${userProp.type})`);
          
          if (userProp.people) {
            userProp.people.forEach(user => {
              debugInfo.allUserNames.push(user.name);
              debugInfo.recordUsers.push(user.name);
              
              // レコードにいるユーザーIDを記録
              recordUserIds.add(user.id);
              
              // ワークスペースユーザー情報とマッチんグ
              if (allWorkspaceUsers.has(user.id)) {
                userMap.set(user.id, allWorkspaceUsers.get(user.id));
              }
            });
          }
        }
      });
    });
    
    const users = Array.from(userMap.values());
    
    console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
    console.log('Found users:', users.map(u => u.name));
    
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
        total_users: users.length,
        debug: {
          foundProperties: Array.from(debugInfo.foundProperties),
          allUserNames: debugInfo.allUserNames,
          recordUsers: debugInfo.recordUsers,
          workspaceUsers: Array.from(allWorkspaceUsers.values()).map(u => u.name),
          recordUserIds: Array.from(recordUserIds),
          sampleRecords: debugInfo.sampleRecords,
          viewId: viewId,
          dateRange: '全期間'
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