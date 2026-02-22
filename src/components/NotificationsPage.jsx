import React, { useState, useEffect } from 'react';
import './NotificationsPage.css';

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('System');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['System'];

  useEffect(() => {
    loadNotifications(activeTab);
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);

    // Placeholder: this page will load from backend API in the next stage.
    await new Promise(resolve => setTimeout(resolve, 500));

    setNotifications([]);
    setLoading(false);
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
        <div className="notif-loading">
          <span>No notifications yet. Data will come from backend.</span>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
