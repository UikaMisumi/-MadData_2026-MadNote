// 自动化测试脚本
console.log('🚀 开始自动化测试...');

// Wait for page load
setTimeout(() => {
  console.log('=== Test 1: Check page elements ===');

  const postCards = document.querySelectorAll('.post-card');
  console.log(`Found ${postCards.length} PostCard components`);

  if (postCards.length > 0) {
    const firstCard = postCards[0];
    const likeBtn = firstCard.querySelector('.like-btn');
    const saveBtn = firstCard.querySelector('.save-btn');

    console.log('First card button state:');
    console.log('- Like button:', likeBtn ? '✅ present' : '❌ missing');
    console.log('- Save button:', saveBtn ? '✅ present' : '❌ missing');

    if (likeBtn) {
      console.log('- Like button class:', likeBtn.className);
      console.log('- Like button SVG:', likeBtn.querySelector('svg') ? '✅' : '❌');
    }

    if (saveBtn) {
      console.log('- 收藏按钮类名:', saveBtn.className);  
      console.log('- 收藏按钮SVG:', saveBtn.querySelector('svg') ? '✅' : '❌');
    }
  }

  console.log('=== Test 2: Check localStorage ===');
  console.log('likedPosts:', localStorage.getItem('likedPosts'));
  console.log('savedPosts:', localStorage.getItem('savedPosts'));
  
}, 2000);

// 测试点击功能
setTimeout(() => {
  console.log('=== Test 3: Simulate clicks ===');

  const postCards = document.querySelectorAll('.post-card');
  if (postCards.length > 0) {
    const firstCard = postCards[0];
    const likeBtn = firstCard.querySelector('.like-btn');
    const saveBtn = firstCard.querySelector('.save-btn');

    if (likeBtn) {
      console.log('🔥 Simulating like button click...');
      likeBtn.click();
      
      setTimeout(() => {
        console.log('State after click:');
        console.log('- localStorage likedPosts:', localStorage.getItem('likedPosts'));
        console.log('- 按钮类名:', likeBtn.className);
      }, 500);
    }
    
    if (saveBtn) {
      setTimeout(() => {
        console.log('🔖 模拟点击收藏按钮...');
        saveBtn.click();
        
        setTimeout(() => {
          console.log('点击后的状态:');
          console.log('- localStorage savedPosts:', localStorage.getItem('savedPosts'));
          console.log('- 按钮类名:', saveBtn.className);
        }, 500);
      }, 1000);
    }
  }
}, 3000);

// 检查个人主页
setTimeout(() => {
  console.log('=== 测试4: 检查个人主页 ===');
  
  // 尝试导航到个人主页
  const profileBtn = document.querySelector('.user-avatar-btn');
  if (profileBtn) {
    console.log('🏠 找到个人主页按钮，点击导航...');
    profileBtn.click();
    
    setTimeout(() => {
      const profileContent = document.querySelector('.profile-content');
      const profileGrid = document.querySelector('.profile-posts-grid');
      
      console.log('个人主页元素检查:');
      console.log('- profile-content:', profileContent ? '✅' : '❌');
      console.log('- profile-posts-grid:', profileGrid ? '✅' : '❌');
      
      if (profileGrid) {
        const profileCards = profileGrid.querySelectorAll('.post-card');
        console.log('- 个人主页卡片数量:', profileCards.length);
      }
    }, 1000);
  } else {
    console.log('❌ 未找到个人主页按钮');
  }
}, 5000);