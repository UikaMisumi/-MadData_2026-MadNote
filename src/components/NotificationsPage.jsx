import React, { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import './NotificationsPage.css';

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('Comments & Mentions');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    'Comments & Mentions',
    'Likes & Saves', 
    'New Followers'
  ];

  useEffect(() => {
    loadNotifications(activeTab);
  }, [activeTab]);

  const loadNotifications = async (tab) => {
    setLoading(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockNotifications = generateMockNotifications(tab);
    setNotifications(mockNotifications);
    setLoading(false);
  };

  const generateMockNotifications = (type) => {
    const baseNotifications = [];
    
    if (type === 'Comments & Mentions') {
      for (let i = 1; i <= 8; i++) {
        baseNotifications.push({
          id: `comment-${i}`,
          type: 'comment',
          user: {
            name: `User${i}`,
            avatar: `https://picsum.photos/32/32?random=${i + 50}`
          },
          text: 'commented on your post',
          time: getRandomTime(),
          postThumbnail: `https://picsum.photos/48/48?random=${i + 100}`
        });
      }
    } else if (type === 'Likes & Saves') {
      for (let i = 1; i <= 12; i++) {
        baseNotifications.push({
          id: `like-${i}`,
          type: 'like',
          user: {
            name: `LikeUser${i}`,
            avatar: `https://picsum.photos/32/32?random=${i + 150}`
          },
          text: i % 3 === 0 ? 'saved your post' : 'liked your post',
          time: getRandomTime(),
          postThumbnail: `https://picsum.photos/48/48?random=${i + 200}`
        });
      }
    } else if (type === 'New Followers') {
      for (let i = 1; i <= 6; i++) {
        baseNotifications.push({
          id: `follow-${i}`,
          type: 'follow',
          user: {
            name: `Follower${i}`,
            avatar: `https://picsum.photos/32/32?random=${i + 250}`
          },
          text: 'started following you',
          time: getRandomTime(),
          postThumbnail: null
        });
      }
    }
    
    return baseNotifications;
  };

  const getRandomTime = () => {
    const times = ['2m ago', '5m ago', '1h ago', '3h ago', '1d ago', '2d ago', '1w ago'];
    return times[Math.floor(Math.random() * times.length)];
  };

  return (
    <div className="notifications-page">
      <div className="notif-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`notif-tab ${tab === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notif-loading">
          <div className="spinner"></div>
          <span>Loading notifications...</span>
        </div>
      ) : (
        <ul className="notif-list">
          {notifications.map(item => (
            <NotificationItem key={item.id} {...item} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;