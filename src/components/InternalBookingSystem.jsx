import React, { useState, useEffect, useCallback } from 'react';

const InternalBookingSystem = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  
  const [notionEvents, setNotionEvents] = useState([]);
  const [notionUsers, setNotionUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isWeekChanging, setIsWeekChanging] = useState(false);

  const settings = {
    startHour: 9,
    endHour: 22,
    systemTitle: 'サブスク事業部予定表',
    description: 'ご希望の日時を選択してください'
  };

  // 2025年の祝日（土日も含む）
  const holidays2025 = [
    '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23',
    '2025-03-20', '2025-04-29', '2025-05-03', '2025-05-04',
    '2025-05-05', '2025-07-21', '2025-08-11', '2025-09-15',
    '2025-09-23', '2025-10-13', '2025-11-03', '2025-11-23',
  ];

  const CALENDAR_DATABASE_ID = process.env.REACT_APP_NOTION_DATABASE_ID || '1f344ae2d2c7804994e3ec2a11bb3f79';

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const isHoliday = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    // 土日（0=日曜、6=土曜）または祝日
    return dayOfWeek === 0 || dayOfWeek === 6 || holidays2025.includes(dateString);
  };

  const generateTimeSlots = (startHour, endHour) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const weekDates = getCurrentWeekDates();
  const timeSlots = generateTimeSlots(settings.startHour, settings.endHour);

  // ワークスペースの全ユーザーを取得
  const fetchNotionUsers = useCallback(async () => {
    try {
      const response = await fetch('/.netlify/functions/notion-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Notion Users APIエラー');
      }

      const data = await response.json();
      
      // APIエラーチェック
      if (data.object === 'error') {
        console.error('Notion APIエラー:', data);
        throw new Error(data.message || 'Notion APIエラー');
      }
      
      console.log('ワークスペースユーザー取得成功:', data);
      console.log('✨ 取得したユーザー一覧:', data.results?.map(u => u.name) || []);
      const userNames = data.results?.map(u => u.name) || [];
      console.log('🔍 奥野翔也さんは含まれている？', userNames.includes('奥野翔也'));
      setNotionUsers(data.results || []);

    } catch (error) {
      console.error('ワークスペースユーザーの取得に失敗:', error);
      setNotionUsers([]);
    }
  }, []);

  const fetchNotionCalendar = useCallback(async (isWeekChange = false, targetWeekDates = null) => {
    try {
      setIsLoading(true);
      if (isWeekChange) {
        setIsWeekChanging(true);
      } else if (isInitialLoading) {
        setIsInitialLoading(true);
      }
      
      const datesForQuery = targetWeekDates || weekDates;
      
      console.log('使用するデータベースID:', CALENDAR_DATABASE_ID);
      console.log('クエリ日付範囲:', datesForQuery[0].toISOString().split('T')[0], '〜', datesForQuery[4].toISOString().split('T')[0]);
      
      const response = await fetch('/.netlify/functions/notion-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseId: CALENDAR_DATABASE_ID,
          filter: {
            property: '日付',
            date: {
              on_or_after: datesForQuery[0].toISOString().split('T')[0],
              on_or_before: datesForQuery[4].toISOString().split('T')[0]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Notion APIエラー');
      }

      const data = await response.json();
      
      // APIエラーチェック
      if (data.object === 'error') {
        console.error('Notion カレンダーAPIエラー:', data);
        console.error('エラーメッセージ:', data.message);
        console.error('使用したデータベースID:', CALENDAR_DATABASE_ID);
        throw new Error(data.message || 'Notion カレンダーAPIエラー');
      }
      
      console.log('カレンダーAPI 完全レスポンス:', JSON.stringify(data, null, 2));
      console.log('data.results:', data.results);
      console.log('data直下のプロパティ:', Object.keys(data));
      
      const events = data.results || data.data || [];
      console.log('実際のイベントデータ:', events);
      
      events?.forEach(event => {
        const eventName = event.properties['予定名']?.title?.[0]?.text?.content || '名前なし';
        const eventStart = event.properties['日付']?.date?.start;
        const eventEnd = event.properties['日付']?.date?.end;
        
        if (eventStart) {
          const start = new Date(eventStart);
          const end = eventEnd ? new Date(eventEnd) : null;
          console.log(`📅 イベント: ${eventName}`, {
            開始: `${start.toLocaleDateString()} ${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`,
            終了: end ? `${end.toLocaleDateString()} ${end.getHours()}:${String(end.getMinutes()).padStart(2, '0')}` : '終了時刻なし（1時間と仮定）',
            元データ: { start: eventStart, end: eventEnd }
          });
        }
      });
      
      setNotionEvents(events || []);

    } catch (error) {
      console.error('Notionカレンダーの取得に失敗:', error);
      setNotionEvents([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
      setIsWeekChanging(false);
    }
  }, [weekDates, isInitialLoading, CALENDAR_DATABASE_ID]);

  const createNotionEvent = async (bookingData) => {
    try {
      const properties = {
        '予定名': {
          title: [
            {
              text: {
                content: bookingData.eventTitle
              }
            }
          ]
        },
        '日付': {
          date: {
            start: `${bookingData.date}T${bookingData.time}:00+09:00`,
            end: `${bookingData.date}T${String(parseInt(bookingData.time.split(':')[0]) + 1).padStart(2, '0')}:00+09:00`
          }
        },
        '担当': {
          people: [
            {
              id: bookingData.userId
            }
          ]
        },
        'ユーザー': {
          people: [
            {
              id: bookingData.userId
            }
          ]
        }
      };

      const response = await fetch('/.netlify/functions/notion-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: CALENDAR_DATABASE_ID },
          properties: properties
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Notion APIエラー詳細:', errorData);
        throw new Error('Notion APIエラー');
      }

      const result = await response.json();
      console.log('Notionに予約を作成:', result);
      return true;
    } catch (error) {
      console.error('Notion予約作成エラー:', error);
      return false;
    }
  };

  const handleWeekChange = async (newOffset) => {
    setIsWeekChanging(true);
    
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (newOffset * 7));
    
    const newWeekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      newWeekDates.push(date);
    }
    
    await Promise.all([
      fetchNotionCalendar(true, newWeekDates),
      new Promise(resolve => {
        setWeekOffset(newOffset);
        resolve();
      })
    ]);
  };

  useEffect(() => {
    if (weekDates && weekDates.length > 0 && isInitialLoading) {
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchNotionCalendar(false),
            fetchNotionUsers()
          ]);
        } catch (error) {
          console.error('初期データ取得エラー:', error);
        }
      };
      fetchData();
    }
  }, [weekDates, isInitialLoading, fetchNotionCalendar, fetchNotionUsers]);

  const getBookingStatus = (date, time) => {
    if (isHoliday(date)) {
      return 'holiday';
    }
    
    const dateString = date.toISOString().split('T')[0];
    const timeHour = parseInt(time.split(':')[0]);
    
    const slotStart = new Date(`${dateString}T${time}:00+09:00`);
    const slotEnd = new Date(`${dateString}T${String(timeHour + 1).padStart(2, '0')}:00+09:00`);
    
    const hasNotionEvent = notionEvents.some(event => {
      const eventStart = event.properties['日付']?.date?.start;
      const eventEnd = event.properties['日付']?.date?.end;
      
      if (!eventStart) return false;
      
      const existingStart = new Date(eventStart);
      let existingEnd;
      
      if (eventEnd) {
        existingEnd = new Date(eventEnd);
      } else {
        existingEnd = new Date(existingStart.getTime() + 60 * 60 * 1000);
      }
      
      const isOverlapping = (existingStart < slotEnd && existingEnd > slotStart);
      return isOverlapping;
    });
    
    if (hasNotionEvent) return 'booked';
    
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${time}`;
    return bookingData[key] || 'available';
  };

  const handleDateSelect = (date) => {
    if (isInitialLoading || isWeekChanging) {
      alert('データを読み込み中です。しばらくお待ちください。');
      return;
    }
    
    if (isHoliday(date)) {
      alert('土日祝日は予約できません。他の日付を選択してください。');
      return;
    }
    
    if (getDateStatus(date) === 'full') {
      alert('選択した日付は満員です。他の日付を選択してください。');
      return;
    }
    
    setSelectedDate(date);
    setShowTimeSlots(true);
  };

  const handleTimeSelect = (time) => {
    if (isInitialLoading || isWeekChanging) {
      alert('データを読み込み中です。しばらくお待ちください。');
      return;
    }
    
    const status = getBookingStatus(selectedDate, time);
    if (status === 'available') {
      setSelectedTime(time);
      setShowBookingForm(true);
    } else {
      alert('選択した時間帯は予約できません。他の時間を選択してください。');
    }
  };

  const handleBooking = async () => {
    await fetchNotionCalendar();
    
    if (isHoliday(selectedDate)) {
      alert('エラー: 土日祝日は予約できません。');
      setShowBookingForm(false);
      setShowTimeSlots(false);
      setSelectedDate(null);
      setSelectedTime(null);
      return;
    }
    
    const currentStatus = getBookingStatus(selectedDate, selectedTime);
    if (currentStatus !== 'available') {
      alert('エラー: 選択した時間帯は既に予約済みです。他の時間を選択してください。');
      setShowBookingForm(false);
      setSelectedTime(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const bookingDataObj = {
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        eventTitle: eventTitle,
        userId: selectedUser
      };
      
      const success = await createNotionEvent(bookingDataObj);
      
      if (success) {
        const bookingKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}-${selectedTime}`;
        setBookingData(prev => ({
          ...prev,
          [bookingKey]: 'booked'
        }));
        
        setShowBookingForm(false);
        setShowTimeSlots(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setEventTitle('');
        setSelectedUser('');
        
        alert('予約が完了しました！');
        await fetchNotionCalendar();
      } else {
        alert('予約の作成に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('予約エラー:', error);
      alert('予約の作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatFullDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const getDayName = (date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  const getDateStatus = (date) => {
    if (isHoliday(date)) return 'holiday';
    
    const availableSlots = timeSlots.filter(time => 
      getBookingStatus(date, time) === 'available'
    ).length;
    
    if (availableSlots === 0) return 'full';
    if (availableSlots <= 3) return 'few';
    return 'available';
  };

  const getDateStatusIcon = (status) => {
    switch (status) {
      case 'holiday': return '🚫';
      case 'full': return '❌';
      case 'few': return '⚠️';
      case 'available': return '✅';
      default: return '✅';
    }
  };

  const getDateStatusText = (status) => {
    switch (status) {
      case 'holiday': return '休業日';
      case 'full': return '満員';
      case 'few': return '残少';
      case 'available': return '空あり';
      default: return '空あり';
    }
  };

  const getDateCardClass = (date) => {
    const status = getDateStatus(date);
    const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
    
    if (isSelected) {
      return 'gradient-border bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl transform scale-105';
    }
    
    switch (status) {
      case 'holiday': 
        return 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed';
      case 'full': 
        return 'bg-red-50 border-red-200 opacity-75 cursor-not-allowed';
      case 'few': 
        return 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 hover:shadow-xl hover-lift cursor-pointer';
      case 'available': 
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl hover-lift cursor-pointer';
      default: 
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl hover-lift cursor-pointer';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 z-50 glassmorphism shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold tracking-tight mb-2 drop-shadow-lg">
                <i className="fas fa-building mr-3"></i>
                {settings.systemTitle}
              </h1>
              <p className="text-white/90 text-sm font-light tracking-wide">{settings.description}</p>
            </div>
          </div>
          
          {/* プログレスバー */}
          {(isLoading || isInitialLoading || isWeekChanging) && (
            <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-pulse"></div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="p-6 space-y-6">
          {!showTimeSlots && !showBookingForm && (
            <>
              {/* 週選択 */}
              <div className="glassmorphism rounded-2xl p-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleWeekChange(weekOffset - 1)}
                    disabled={isInitialLoading || isWeekChanging}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-chevron-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
                    前週
                  </button>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gradient mb-1">
                      {weekDates && weekDates.length > 0 ? `${formatDate(weekDates[0])} - ${formatDate(weekDates[4])}` : '読み込み中...'}
                    </div>
                    <div className="text-xs text-gray-500 font-light">平日のみ表示</div>
                  </div>
                  
                  <button 
                    onClick={() => handleWeekChange(weekOffset + 1)}
                    disabled={isInitialLoading || isWeekChanging}
                    className="group px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    翌週
                    <i className="fas fa-chevron-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </button>
                </div>
              </div>

              {/* 凡例 */}
              <div className="glassmorphism rounded-2xl p-4 shadow-lg">
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✅</span>
                    <span className="text-xs font-medium text-gray-700">空あり</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-xs font-medium text-gray-700">残少</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">❌</span>
                    <span className="text-xs font-medium text-gray-700">満員</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🚫</span>
                    <span className="text-xs font-medium text-gray-700">休業</span>
                  </div>
                </div>
              </div>

              {/* 日付選択 */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gradient flex items-center">
                  <i className="fas fa-calendar-day mr-3"></i>
                  日付を選択
                </h2>
                
                {(isInitialLoading || isWeekChanging) && (
                  <div className="glassmorphism rounded-2xl p-8 text-center animate-pulse">
                    <div className="inline-block">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gradient font-semibold">データを読み込んでいます...</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {weekDates.map((date, index) => {
                    const status = getDateStatus(date);
                    const isDisabled = isInitialLoading || isWeekChanging || isHoliday(date) || status === 'full';
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 ${getDateCardClass(date)} ${isDisabled ? '' : 'transform hover:scale-[1.02]'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                              {formatDate(date)} 
                              <span className="text-lg font-medium text-gray-600 ml-2">({getDayName(date)})</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFullDate(date)}
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-4xl mb-1">
                              {(isInitialLoading || isWeekChanging) ? '⏳' : getDateStatusIcon(status)}
                            </div>
                            <div className="text-xs font-semibold text-gray-600">
                              {(isInitialLoading || isWeekChanging) ? '確認中' : getDateStatusText(status)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 時間選択画面 */}
          {showTimeSlots && !showBookingForm && (
            <div className="space-y-6">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowTimeSlots(false);
                    setSelectedDate(null);
                  }}
                  className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gradient">時間を選択</h2>
                  <p className="text-sm text-gray-600">
                    {selectedDate && formatFullDate(selectedDate)} ({selectedDate && getDayName(selectedDate)})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {timeSlots.map((time) => {
                  const status = getBookingStatus(selectedDate, time);
                  const isAvailable = status === 'available';
                  
                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={!isAvailable}
                      className={`relative p-6 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
                        isAvailable
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        <i className={`far ${isAvailable ? 'fa-clock' : 'fa-times-circle'}`}></i>
                      </div>
                      <div className="text-xl font-bold">{time}</div>
                      <div className="text-xs mt-1 opacity-90">
                        {isAvailable ? '予約可能' : '予約済み'}
                      </div>
                      {isAvailable && (
                        <div className="absolute top-2 right-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 予約フォーム */}
          {showBookingForm && (
            <div className="space-y-6">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedTime(null);
                  }}
                  className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="ml-4 text-2xl font-bold text-gradient">予約情報入力</h2>
              </div>

              <div className="glassmorphism rounded-2xl p-6 shadow-xl">
                <div className="text-lg font-bold text-blue-800 mb-3">予約内容確認</div>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center">
                    <i className="fas fa-calendar-alt mr-3 text-blue-500"></i>
                    {selectedDate && formatFullDate(selectedDate)} ({selectedDate && getDayName(selectedDate)})
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-clock mr-3 text-blue-500"></i>
                    {selectedTime}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-3 flex items-center">
                    <i className="fas fa-edit mr-2 text-blue-500"></i>
                    予定名 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg bg-white/80 backdrop-blur"
                    placeholder="予定名を入力してください"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-3 flex items-center">
                    <i className="fas fa-user mr-2 text-blue-500"></i>
                    担当者 <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg bg-white/80 backdrop-blur"
                    required
                  >
                    <option value="">担当者を選択してください</option>
                    {notionUsers.filter(user => user.type === 'person').map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.person?.email || 'Unknown User'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-lg hover:bg-gray-100 transition-all duration-300"
                  >
                    <i className="fas fa-times mr-2"></i>
                    キャンセル
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={!eventTitle.trim() || !selectedUser || isLoading}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        処理中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle mr-2"></i>
                        予約確定
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="mt-12 p-6 glassmorphism">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-2"></i>
              予約は1時間単位です（平日のみ）
            </p>
            <p className="text-sm text-gray-600">
              <i className="fas fa-clock mr-2"></i>
              営業時間：{settings.startHour}:00 - {settings.endHour}:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalBookingSystem;