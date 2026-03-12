// In-memory posts store for Vercel.
// Note: state persists while the function instance is warm but resets on cold starts.
// For persistent storage, replace with a database (e.g. Vercel KV, Supabase).
const posts: any[] = [
  {
    id: "1",
    author: "Seedance Team",
    avatar: "🌱",
    content: "Welcome to the Seedance 2.0 Community Forum! Share your best prompts here.",
    timestamp: Date.now() - 100000,
    likes: 5,
  }
];

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    const { action, postId, author, avatar, content } = req.body;

    if (action === 'like') {
      const post = posts.find(p => p.id === postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      post.likes += 1;
      return res.status(200).json(post);
    }

    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const post = {
      id: Math.random().toString(36).substring(2, 9),
      author: author || 'Anonymous',
      avatar: avatar || '👤',
      content,
      timestamp: Date.now(),
      likes: 0
    };
    posts.unshift(post);
    return res.status(201).json(post);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
