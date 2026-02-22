import React, { useState } from 'react';
import './CategoryNav.css';

function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState('For You');

  const categories = [
    'For You',
    'Following',
    'Trending',
    'MadNote',
    'Gaming',
    'Entertainment',
    'Technology',
    'Fashion',
    'Food',
    'Travel',
    'Photography',
    'Art',
    'Music'
  ];

  return (
    <div className="category-nav">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-item ${activeCategory === category ? 'active' : ''}`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryNav;