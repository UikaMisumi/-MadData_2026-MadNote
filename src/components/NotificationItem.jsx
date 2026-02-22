import React from 'react';
import './NotificationItem.css';

function NotificationItem({ user, postThumbnail, text, time }) {
  return (
    <li className="notification-item">
      <div className="notif-left">
        <img className="notif-avatar" src={user.avatar} alt={user.name} />
        <div className="notif-content">
          <p className="notif-text">
            <strong>{user.name}</strong> {text}
          </p>
          <p className="notif-time">{time}</p>
        </div>
      </div>
      {postThumbnail && (
        <img className="notif-thumb" src={postThumbnail} alt="Post thumbnail" />
      )}
    </li>
  );
}

export default NotificationItem;