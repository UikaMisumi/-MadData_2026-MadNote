import React, { useState } from 'react';

function ImageCard({ image }) {
  const [likes, setLikes] = useState(image.likes);

  const handleLike = () => {
    setLikes(likes + 1);
  };

  return (
    <div className="image-card">
      <img src={image.url} alt={image.caption} />
      <div className="caption">{image.caption}</div>
      <div className="interaction-buttons">
        <button onClick={handleLike}>❤️ {likes}</button>
        <button>💬 Comment</button>
        <button>🔖 Save</button>
      </div>
      <div className="comments">
        {image.comments.map((comment, index) => (
          <p key={index}><strong>{comment.user}: </strong>{comment.comment}</p>
        ))}
      </div>
    </div>
  );
}

export default ImageCard;
