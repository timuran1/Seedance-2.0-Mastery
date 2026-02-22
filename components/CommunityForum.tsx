import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
}

const CommunityForum: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Fetch initial posts
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Failed to fetch posts", err));

    // Connect socket
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('post_added', (post: Post) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('post_updated', (updatedPost: Post) => {
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !authorName.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('new_post', {
        author: authorName,
        content: newPostContent,
      });
      setNewPostContent('');
    }
  };

  const handleLike = (postId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('like_post', postId);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community Forum</h1>
          <p className="text-slate-400">Discuss Seedance 2.0, share your best prompts, and help others.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Post */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Share a Prompt
            </h2>
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. PromptMaster99"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Message / Prompt</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your prompt or ask a question..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none h-32"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!isConnected || !newPostContent.trim() || !authorName.trim()}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post to Forum
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-2 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
              No posts yet. Be the first to share!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold shadow-inner">
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{post.author}</h3>
                      <p className="text-xs text-slate-500">{formatTime(post.timestamp)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap mb-4 text-sm leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 border-t border-slate-700/50 pt-3">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-400 transition-colors group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
