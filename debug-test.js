// 调试脚本 - 测试点赞收藏功能
console.log('🔍 开始调试测试...');

// 1. 测试localStorage
console.log('📦 localStorage 状态:');
console.log('likedPosts:', localStorage.getItem('likedPosts'));
console.log('savedPosts:', localStorage.getItem('savedPosts'));

// 2. 测试PostCard组件是否正确加载
setTimeout(() => {
  console.log('🎯 检查PostCard组件...');
  const postCards = document.querySelectorAll('.post-card');
  console.log(`找到 ${postCards.length} 个PostCard组件`);
  
  if (postCards.length > 0) {
    const firstCard = postCards[0];
    const likeBtn = firstCard.querySelector('.like-btn');
    const saveBtn = firstCard.querySelector('.save-btn');

    console.log('First card buttons:', {
      likeBtn: likeBtn ? '✅' : '❌',
      saveBtn: saveBtn ? '✅' : '❌'
    });

    if (likeBtn) {
      console.log('Clicking like button...');
      likeBtn.click();
      
      setTimeout(() => {
        console.log('点击后的状态:');
        console.log('likedPosts:', localStorage.getItem('likedPosts'));
        console.log('点赞按钮类名:', likeBtn.className);
      }, 500);
    }
  }
}, 2000);

// 3. 测试个人主页
setTimeout(() => {
  console.log('🏠 检查个人主页布局...');
  const profileContent = document.querySelector('.profile-content');
  const profileGrid = document.querySelector('.profile-posts-grid');
  
  if (profileContent) {
    const styles = getComputedStyle(profileContent);
    console.log('个人主页内容区域宽度:', styles.width);
    console.log('个人主页内容区域max-width:', styles.maxWidth);
  }
  
  if (profileGrid) {
    const styles = getComputedStyle(profileGrid);
    console.log('个人主页网格布局:', styles.gridTemplateColumns);
  }
}, 3000);