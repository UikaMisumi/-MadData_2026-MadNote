import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PostsContext = createContext();

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

export const PostsProvider = ({ children }) => {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [posts, setPosts] = useState([]);

  // Get user-specific localStorage keys
  const getUserStorageKey = (key) => {
    const userId = user?.id || 'anonymous';
    return `${key}_${userId}`;
  };

  // 榛樿绀轰緥甯栧瓙鏁版嵁
  const defaultPosts = [
    {
      id: 'demo-1',
      title: 'Amazing MadNote World Discovery',
      content: 'Found this incredible world in MadNote today! The attention to detail is absolutely stunning.',
      imageUrl: 'https://picsum.photos/400/500?random=1',
      image: 'https://picsum.photos/400/500?random=1',
      author: {
        id: 'demo-user-1',
        name: 'VR Explorer',
        avatar: 'https://picsum.photos/40/40?random=10'
      },
      tags: ['MadNote', 'WorldDiscovery', 'Amazing'],
      location: 'Crystal Caverns',
      likesCount: 42,
      savesCount: 18,
      comments: [
        {
          id: 'comment-1',
          text: 'This world looks amazing! What\'s the name? 馃槏',
          author: { name: 'CuriousUser', avatar: 'https://picsum.photos/32/32?random=11' },
          timestamp: '2 hours ago',
          likesCount: 3,
          replies: [
            {
              id: 'reply-1-1',
              text: 'It\'s called "Crystal Caverns" - you can find it in the fantasy worlds section!',
              author: { name: 'VR Explorer', avatar: 'https://picsum.photos/32/32?random=10' },
              timestamp: '1 hour ago',
              likesCount: 2
            },
            {
              id: 'reply-1-2',
              text: 'Thanks for sharing! Going to check it out right now 馃殌',
              author: { name: 'WorldHunter', avatar: 'https://picsum.photos/32/32?random=35' },
              timestamp: '45 minutes ago',
              likesCount: 1
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'demo-2',
      title: 'MadNote Avatar Showcase',
      content: 'Check out my new custom avatar! Spent weeks working on the design and animations.',
      imageUrl: 'https://picsum.photos/400/500?random=2',
      image: 'https://picsum.photos/400/500?random=2',
      author: {
        id: 'demo-user-2',
        name: 'Avatar Artist',
        avatar: 'https://picsum.photos/40/40?random=12'
      },
      tags: ['Avatar', 'Custom', 'Art'],
      location: 'Avatar World',
      likesCount: 89,
      savesCount: 34,
      comments: [],
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'demo-3',
      title: 'Virtual Concert Experience',
      content: 'What an incredible virtual concert! The community in MadNote never ceases to amaze me.',
      imageUrl: 'https://picsum.photos/400/500?random=3',
      image: 'https://picsum.photos/400/500?random=3',
      author: {
        id: 'demo-user-3',
        name: 'Music Lover',
        avatar: 'https://picsum.photos/40/40?random=13'
      },
      tags: ['Concert', 'Music', 'Community'],
      location: 'Virtual Stage',
      likesCount: 156,
      savesCount: 67,
      comments: [
        {
          id: 'comment-2',
          text: 'I was there too! Amazing performance! 馃幍馃帳',
          author: { name: 'ConcertGoer', avatar: 'https://picsum.photos/32/32?random=14' },
          timestamp: '1 day ago',
          likesCount: 8,
          replies: [
            {
              id: 'reply-2-1',
              text: 'The bass drop was insane! My headset almost fell off 馃槀',
              author: { name: 'BassHead', avatar: 'https://picsum.photos/32/32?random=36' },
              timestamp: '20 hours ago',
              likesCount: 5
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'demo-4',
      title: 'Cyberpunk Neon City Adventure',
      content: 'Exploring the neon-lit streets of this cyberpunk world was an incredible experience! The lighting effects are phenomenal.',
      imageUrl: 'https://picsum.photos/400/500?random=4',
      image: 'https://picsum.photos/400/500?random=4',
      author: {
        id: 'demo-user-4',
        name: 'Cyber Tourist',
        avatar: 'https://picsum.photos/40/40?random=15'
      },
      tags: ['Cyberpunk', 'Neon', 'City', 'Aesthetic'],
      location: 'Neo Tokyo',
      likesCount: 234,
      savesCount: 89,
      comments: [
        {
          id: 'comment-3',
          text: 'The atmosphere in this world is incredible!',
          author: { name: 'NeonFan', avatar: 'https://picsum.photos/32/32?random=16' },
          timestamp: '3 hours ago'
        }
      ],
      createdAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
      id: 'demo-5',
      title: 'Cozy Caf茅 Hangout Session',
      content: 'Spent the afternoon at this adorable virtual caf茅 with friends. Perfect place to relax and chat!',
      imageUrl: 'https://picsum.photos/400/500?random=5',
      image: 'https://picsum.photos/400/500?random=5',
      author: {
        id: 'demo-user-5',
        name: 'Caf茅 Lover',
        avatar: 'https://picsum.photos/40/40?random=17'
      },
      tags: ['Caf茅', 'Cozy', 'Friends', 'Relaxing'],
      location: 'Virtual Caf茅',
      likesCount: 67,
      savesCount: 23,
      comments: [],
      createdAt: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'demo-6',
      title: 'Epic Fantasy Castle Tour',
      content: 'This medieval fantasy world has the most detailed castle I\'ve ever seen in MadNote. The architecture is breathtaking!',
      imageUrl: 'https://picsum.photos/400/500?random=6',
      image: 'https://picsum.photos/400/500?random=6',
      author: {
        id: 'demo-user-6',
        name: 'Fantasy Explorer',
        avatar: 'https://picsum.photos/40/40?random=18'
      },
      tags: ['Fantasy', 'Castle', 'Medieval', 'Architecture'],
      location: 'Dragon\'s Keep',
      likesCount: 178,
      savesCount: 56,
      comments: [
        {
          id: 'comment-4',
          text: 'I love the attention to detail in the stonework!',
          author: { name: 'ArchitectFan', avatar: 'https://picsum.photos/32/32?random=19' },
          timestamp: '5 hours ago'
        },
        {
          id: 'comment-5',
          text: 'Been looking for a good medieval world, thanks for sharing!',
          author: { name: 'KnightRP', avatar: 'https://picsum.photos/32/32?random=20' },
          timestamp: '4 hours ago'
        }
      ],
      createdAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
      id: 'demo-7',
      title: 'Underwater Ocean Paradise',
      content: 'Swimming with virtual dolphins and exploring coral reefs - this underwater world is absolutely magical!',
      imageUrl: 'https://picsum.photos/400/500?random=7',
      image: 'https://picsum.photos/400/500?random=7',
      author: {
        id: 'demo-user-7',
        name: 'Ocean Dreamer',
        avatar: 'https://picsum.photos/40/40?random=21'
      },
      tags: ['Ocean', 'Underwater', 'Marine', 'Peaceful'],
      location: 'Coral Paradise',
      likesCount: 145,
      savesCount: 78,
      comments: [
        {
          id: 'comment-6',
          text: 'The water physics in this world are amazing!',
          author: { name: 'DivingEnthusiast', avatar: 'https://picsum.photos/32/32?random=22' },
          timestamp: '6 hours ago'
        }
      ],
      createdAt: new Date(Date.now() - 21600000).toISOString()
    },
    {
      id: 'demo-8',
      title: 'Space Station Zero-G Fun',
      content: 'Floating around in zero gravity never gets old! This space station world has incredible physics simulation.',
      imageUrl: 'https://picsum.photos/400/500?random=8',
      image: 'https://picsum.photos/400/500?random=8',
      author: {
        id: 'demo-user-8',
        name: 'Space Cadet',
        avatar: 'https://picsum.photos/40/40?random=23'
      },
      tags: ['Space', 'ZeroGravity', 'Station', 'Physics'],
      location: 'Orbital Station Alpha',
      likesCount: 298,
      savesCount: 134,
      comments: [
        {
          id: 'comment-7',
          text: 'The zero-G mechanics are so well done here!',
          author: { name: 'AstronautRP', avatar: 'https://picsum.photos/32/32?random=24' },
          timestamp: '8 hours ago'
        },
        {
          id: 'comment-8',
          text: 'Perfect for space roleplay sessions!',
          author: { name: 'SciFiFan', avatar: 'https://picsum.photos/32/32?random=25' },
          timestamp: '7 hours ago'
        }
      ],
      createdAt: new Date(Date.now() - 28800000).toISOString()
    },
    {
      id: 'demo-9',
      title: 'Magical Forest Gathering',
      content: 'Found this enchanted forest where magical creatures roam freely. The lighting effects through the trees are stunning!',
      imageUrl: 'https://picsum.photos/400/500?random=9',
      image: 'https://picsum.photos/400/500?random=9',
      author: {
        id: 'demo-user-9',
        name: 'Forest Wanderer',
        avatar: 'https://picsum.photos/40/40?random=26'
      },
      tags: ['Magic', 'Forest', 'Nature', 'Fantasy'],
      location: 'Whispering Woods',
      likesCount: 189,
      savesCount: 92,
      comments: [
        {
          id: 'comment-9',
          text: 'I love the ambient sounds in this world!',
          author: { name: 'NatureLover', avatar: 'https://picsum.photos/32/32?random=27' },
          timestamp: '1 day ago'
        }
      ],
      createdAt: new Date(Date.now() - 108000000).toISOString()
    },
    {
      id: 'demo-10',
      title: 'Retro 80s Arcade Night',
      content: 'Throwback to the 80s in this amazing retro arcade world! All the classic games are here and fully playable.',
      imageUrl: 'https://picsum.photos/400/500?random=10',
      image: 'https://picsum.photos/400/500?random=10',
      author: {
        id: 'demo-user-10',
        name: 'Retro Gamer',
        avatar: 'https://picsum.photos/40/40?random=28'
      },
      tags: ['Retro', '80s', 'Arcade', 'Gaming'],
      location: 'Neon Arcade',
      likesCount: 267,
      savesCount: 156,
      comments: [
        {
          id: 'comment-10',
          text: 'Playing Pac-Man in VR hits different!',
          author: { name: 'ArcadeFan', avatar: 'https://picsum.photos/32/32?random=29' },
          timestamp: '12 hours ago',
          likesCount: 15,
          replies: [
            {
              id: 'reply-10-1',
              text: 'Right?! And the 3D maze perspective is mind-blowing 馃く',
              author: { name: 'RetroGamer', avatar: 'https://picsum.photos/32/32?random=28' },
              timestamp: '11 hours ago',
              likesCount: 7
            },
            {
              id: 'reply-10-2',
              text: 'Wait until you try Space Invaders in there! 馃殌馃懡',
              author: { name: 'ClassicGamer', avatar: 'https://picsum.photos/32/32?random=37' },
              timestamp: '9 hours ago',
              likesCount: 4
            }
          ]
        },
        {
          id: 'comment-11',
          text: 'The synthwave music really completes the vibe! 馃幎馃挏',
          author: { name: 'SynthwaveFan', avatar: 'https://picsum.photos/32/32?random=30' },
          timestamp: '10 hours ago',
          likesCount: 12,
          replies: [
            {
              id: 'reply-11-1',
              text: 'The lighting effects sync perfectly with the beats too!',
              author: { name: 'VisualFX_Pro', avatar: 'https://picsum.photos/32/32?random=38' },
              timestamp: '8 hours ago',
              likesCount: 6
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: 'demo-11',
      title: 'Japanese Garden Meditation',
      content: 'This peaceful Japanese garden is perfect for meditation and quiet reflection. The zen atmosphere is incredible.',
      imageUrl: 'https://picsum.photos/400/500?random=11',
      image: 'https://picsum.photos/400/500?random=11',
      author: {
        id: 'demo-user-11',
        name: 'Zen Seeker',
        avatar: 'https://picsum.photos/40/40?random=31'
      },
      tags: ['Japanese', 'Garden', 'Meditation', 'Peaceful'],
      location: 'Sakura Gardens',
      likesCount: 134,
      savesCount: 89,
      comments: [
        {
          id: 'comment-12',
          text: 'I come here whenever I need to relax and unwind.',
          author: { name: 'MindfulUser', avatar: 'https://picsum.photos/32/32?random=32' },
          timestamp: '2 days ago'
        }
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'demo-12',
      title: 'Halloween Horror House',
      content: 'Bravely explored this spooky horror house with friends. Perfect for Halloween season - genuinely scary!',
      imageUrl: 'https://picsum.photos/400/500?random=12',
      image: 'https://picsum.photos/400/500?random=12',
      author: {
        id: 'demo-user-12',
        name: 'Horror Enthusiast',
        avatar: 'https://picsum.photos/40/40?random=33'
      },
      tags: ['Horror', 'Halloween', 'Scary', 'Friends'],
      location: 'Haunted Manor',
      likesCount: 223,
      savesCount: 67,
      comments: [
        {
          id: 'comment-13',
          text: 'I screamed so loud my neighbors complained!',
          author: { name: 'ScaredyCat', avatar: 'https://picsum.photos/32/32?random=34' },
          timestamp: '1 day ago'
        },
        {
          id: 'comment-14',
          text: 'The jump scares in this world are expertly timed.',
          author: { name: 'HorrorCritic', avatar: 'https://picsum.photos/32/32?random=35' },
          timestamp: '18 hours ago'
        }
      ],
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  useEffect(() => {
    const loadAllUserPosts = () => {
      const allUserPosts = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userPosts_')) {
          try {
            const posts = JSON.parse(localStorage.getItem(key) || '[]');
            allUserPosts.push(...posts);
          } catch (error) {
            console.error('Failed to parse user posts from', key, error);
          }
        }
      }
      
      setUserPosts(allUserPosts);
      console.log('PostsContext: loaded user posts count', allUserPosts.length);
    };

    loadAllUserPosts();
  }, []); // 鍙湪缁勪欢mount鏃跺姞杞戒竴娆?
  useEffect(() => {
    // Load saved counts for default posts (user-specific)
    const defaultPostCountsKey = getUserStorageKey('defaultPostCounts');
    const defaultPostCounts = JSON.parse(localStorage.getItem(defaultPostCountsKey) || '{}');
    
    // Apply saved counts to default posts
    const updatedDefaultPosts = defaultPosts.map(post => ({
      ...post,
      comments: [],
      likesCount: defaultPostCounts[post.id]?.likesCount ?? post.likesCount,
      savesCount: defaultPostCounts[post.id]?.savesCount ?? post.savesCount
    }));
    
    const allPosts = [...userPosts, ...updatedDefaultPosts].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setPosts(allPosts);
    console.log('PostsContext: merged posts count', allPosts.length, 'for user', user?.id || 'anonymous');
  }, [userPosts, user?.id]);

  const addPost = (newPost) => {
    // 濡傛灉甯栧瓙宸茬粡鏈塈D锛屽氨浣跨敤鐜版湁ID锛涘惁鍒欑敓鎴愭柊ID
    const postWithId = {
      ...newPost,
      id: newPost.id || `user-post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: newPost.createdAt || new Date().toISOString()
    };
    
    console.log('PostsContext: adding post for user', user?.id, postWithId);
    
    // 鍙繚瀛樺埌褰撳墠鐢ㄦ埛鐨勫瓨鍌ㄤ腑
    const currentUserPosts = JSON.parse(localStorage.getItem(getUserStorageKey('userPosts')) || '[]');
    const updatedCurrentUserPosts = [postWithId, ...currentUserPosts];
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedCurrentUserPosts));
    
    // 閲嶆柊鍔犺浇鎵€鏈夌敤鎴峰笘瀛愪互鏇存柊鏄剧ず
    const loadAllUserPosts = () => {
      const allUserPosts = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userPosts_')) {
          try {
            const posts = JSON.parse(localStorage.getItem(key) || '[]');
            allUserPosts.push(...posts);
          } catch (error) {
            console.error('Failed to parse user posts from', key, error);
          }
        }
      }
      
      setUserPosts(allUserPosts);
      console.log('PostsContext: reloaded user posts count', allUserPosts.length);
    };
    
    loadAllUserPosts();
    
    console.log('馃摑 PostsContext: 鐢ㄦ埛', user?.id, '鐨勫笘瀛愬凡娣诲姞');
    
    return postWithId;
  };

  const removePost = (postId) => {
    // 鍙粠褰撳墠鐢ㄦ埛鐨勫瓨鍌ㄤ腑鍒犻櫎
    const currentUserPosts = JSON.parse(localStorage.getItem(getUserStorageKey('userPosts')) || '[]');
    const updatedCurrentUserPosts = currentUserPosts.filter(post => post.id !== postId);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedCurrentUserPosts));
    
    const loadAllUserPosts = () => {
      const allUserPosts = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userPosts_')) {
          try {
            const posts = JSON.parse(localStorage.getItem(key) || '[]');
            allUserPosts.push(...posts);
          } catch (error) {
            console.error('Failed to parse user posts from', key, error);
          }
        }
      }
      
      setUserPosts(allUserPosts);
    };
    
    loadAllUserPosts();
  };

  const updatePost = (postId, updates) => {
    // 鍙洿鏂板綋鍓嶇敤鎴风殑瀛樺偍涓殑甯栧瓙
    const currentUserPosts = JSON.parse(localStorage.getItem(getUserStorageKey('userPosts')) || '[]');
    const updatedCurrentUserPosts = currentUserPosts.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    );
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedCurrentUserPosts));
    
    const loadAllUserPosts = () => {
      const allUserPosts = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userPosts_')) {
          try {
            const posts = JSON.parse(localStorage.getItem(key) || '[]');
            allUserPosts.push(...posts);
          } catch (error) {
            console.error('Failed to parse user posts from', key, error);
          }
        }
      }
      
      setUserPosts(allUserPosts);
    };
    
    loadAllUserPosts();
  };

  const addComment = (postId, commentText) => {
    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: commentText,
      author: { 
        name: user?.name || user?.username || 'Anonymous User', 
        avatar: user?.avatar || 'https://picsum.photos/32/32?random=99' 
      },
      timestamp: 'just now'
    };

    // Update posts array (includes both user and default posts)
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedComments = [...(post.comments || []), newComment];
        return { ...post, comments: updatedComments };
      }
      return post;
    });
    setPosts(updatedPosts);

    // Also update userPosts if it's a user post
    const updatedUserPosts = userPosts.map(post => {
      if (post.id === postId) {
        const updatedComments = [...(post.comments || []), newComment];
        return { ...post, comments: updatedComments };
      }
      return post;
    });
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    console.log('馃挰 Added comment to post', postId, newComment);
    return newComment;
  };

  const addReply = (commentId, replyText) => {
    const newReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: replyText,
      author: { 
        name: user?.name || user?.username || 'Anonymous User', 
        avatar: user?.avatar || 'https://picsum.photos/32/32?random=99' 
      },
      timestamp: 'just now',
      likesCount: 0
    };

    // Update posts array (includes both user and default posts)
    const updatedPosts = posts.map(post => {
      const updatedComments = post.comments?.map(comment => {
        if (comment.id === commentId) {
          const updatedReplies = [...(comment.replies || []), newReply];
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      return { ...post, comments: updatedComments };
    });
    setPosts(updatedPosts);

    // Also update userPosts if it's a user post
    const updatedUserPosts = userPosts.map(post => {
      const updatedComments = post.comments?.map(comment => {
        if (comment.id === commentId) {
          const updatedReplies = [...(comment.replies || []), newReply];
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });
      return { ...post, comments: updatedComments };
    });
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    console.log('馃挰 Added reply to comment', commentId, newReply);
    return newReply;
  };

  const likeComment = (commentId, isLiked, isReply = false, parentCommentId = null) => {
    const updateCommentLikes = (comments) => {
      return comments?.map(comment => {
        if (comment.id === commentId) {
          const currentLikes = comment.likesCount || 0;
          return {
            ...comment,
            likesCount: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
          };
        }
        
        // If this is a reply, check in the replies array
        if (isReply && comment.id === parentCommentId && comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              const currentLikes = reply.likesCount || 0;
              return {
                ...reply,
                likesCount: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
              };
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }
        
        return comment;
      });
    };

    // Update posts array
    const updatedPosts = posts.map(post => ({
      ...post,
      comments: updateCommentLikes(post.comments)
    }));
    setPosts(updatedPosts);

    // Update userPosts if needed
    const updatedUserPosts = userPosts.map(post => ({
      ...post,
      comments: updateCommentLikes(post.comments)
    }));
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    console.log('鉂わ笍 Updated comment like count', commentId, isLiked ? '+1' : '-1');
  };

  const deleteComment = (commentId, isReply = false, parentCommentId = null) => {
    const updateComments = (comments) => {
      if (isReply && parentCommentId) {
        return comments?.map(comment => {
          if (comment.id === parentCommentId) {
            const updatedReplies = comment.replies?.filter(reply => reply.id !== commentId) || [];
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });
      } else {
        return comments?.filter(comment => comment.id !== commentId);
      }
    };

    // Update posts array
    const updatedPosts = posts.map(post => ({
      ...post,
      comments: updateComments(post.comments)
    }));
    setPosts(updatedPosts);

    // Update userPosts if needed
    const updatedUserPosts = userPosts.map(post => ({
      ...post,
      comments: updateComments(post.comments)
    }));
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    console.log('馃棏锔?Deleted comment', commentId);
  };

  const deletePost = (postId) => {
    // Remove from userPosts
    const updatedUserPosts = userPosts.filter(post => post.id !== postId);
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));
    
    // Update merged posts array
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    
    console.log('馃棏锔?Deleted post:', postId);
  };

  const updateLikeCount = (postId, isLiked) => {
    // Update posts array (includes both user and default posts)
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const currentLikes = post.likesCount || 0;
        return { 
          ...post, 
          likesCount: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      }
      return post;
    });
    setPosts(updatedPosts);

    // Update userPosts if it's a user post
    const updatedUserPosts = userPosts.map(post => {
      if (post.id === postId) {
        const currentLikes = post.likesCount || 0;
        return { 
          ...post, 
          likesCount: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
        };
      }
      return post;
    });
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    // For default posts, save the updated counts to localStorage
    if (postId.startsWith('demo-')) {
      const defaultPostCounts = JSON.parse(localStorage.getItem('defaultPostCounts') || '{}');
      defaultPostCounts[postId] = {
        ...defaultPostCounts[postId],
        likesCount: updatedPosts.find(p => p.id === postId)?.likesCount || 0
      };
      localStorage.setItem(getUserStorageKey('defaultPostCounts'), JSON.stringify(defaultPostCounts));
    }

    console.log('鉂わ笍 Updated like count for post', postId, isLiked ? '+1' : '-1');
  };

  const updateSaveCount = (postId, isSaved) => {
    // Update posts array (includes both user and default posts)
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const currentSaves = post.savesCount || 0;
        return { 
          ...post, 
          savesCount: isSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1)
        };
      }
      return post;
    });
    setPosts(updatedPosts);

    // Update userPosts if it's a user post
    const updatedUserPosts = userPosts.map(post => {
      if (post.id === postId) {
        const currentSaves = post.savesCount || 0;
        return { 
          ...post, 
          savesCount: isSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1)
        };
      }
      return post;
    });
    setUserPosts(updatedUserPosts);
    localStorage.setItem(getUserStorageKey('userPosts'), JSON.stringify(updatedUserPosts));

    // For default posts, save the updated counts to localStorage
    if (postId.startsWith('demo-')) {
      const defaultPostCounts = JSON.parse(localStorage.getItem('defaultPostCounts') || '{}');
      defaultPostCounts[postId] = {
        ...defaultPostCounts[postId],
        savesCount: updatedPosts.find(p => p.id === postId)?.savesCount || 0
      };
      localStorage.setItem(getUserStorageKey('defaultPostCounts'), JSON.stringify(defaultPostCounts));
    }

    console.log('馃捑 Updated save count for post', postId, isSaved ? '+1' : '-1');
  };

  const getCurrentUserPosts = () => {
    if (!user?.id) return [];
    const currentUserPosts = JSON.parse(localStorage.getItem(getUserStorageKey('userPosts')) || '[]');
    return currentUserPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const value = {
    posts, // 鍚堝苟鍚庣殑鎵€鏈夊笘瀛?(鐢ㄤ簬HomePage鏄剧ず)
    userPosts, // 鎵€鏈夌敤鎴风殑甯栧瓙 (閲嶅懡鍚嶄絾淇濇寔鍏煎鎬?
    getCurrentUserPosts, // 褰撳墠鐢ㄦ埛鐨勫笘瀛?(鐢ㄤ簬ProfilePage鏄剧ず)
    addPost,
    removePost,
    updatePost,
    addComment,
    addReply,
    likeComment,
    deleteComment,
    deletePost,
    updateLikeCount,
    updateSaveCount
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};
