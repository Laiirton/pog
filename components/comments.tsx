import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  media_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface CommentsProps {
  mediaId: string;
  username: string | null;
}

export const Comments = ({ mediaId, username }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?mediaId=${mediaId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchComments();
  }, [mediaId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId, username, content: newComment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const addedComment = await response.json();
      setComments([addedComment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div>
        {comments.map((comment) => (
          <div key={comment.id}>
            <p><strong>{comment.username}</strong>: {comment.content}</p>
            <p>{new Date(comment.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      {username && (
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment"
          />
          <button onClick={handleAddComment}>Submit</button>
        </div>
      )}
    </div>
  );
};