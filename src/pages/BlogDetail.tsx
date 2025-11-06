import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, MessageCircle, Edit, Trash2, ArrowLeft, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

const BlogDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBlog();
      loadComments();
      loadLikes();
    }
  }, [id]);

  const loadBlog = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Blog not found");
      navigate("/");
      return;
    }

    // Load profile separately
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", data.user_id)
      .single();

    setBlog({ ...data, profiles: profileData || { username: "Unknown" } });
    setLoading(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("blog_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      // Load profiles for all comments
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", comment.user_id)
            .single();
          
          return {
            ...comment,
            profiles: profileData || { username: "Unknown" }
          };
        })
      );
      setComments(commentsWithProfiles);
    }
  };

  const loadLikes = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("blog_id", id);

    setLikesCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("blog_id", id)
        .eq("user_id", user.id)
        .single();

      setIsLiked(!!data);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("blog_id", id)
        .eq("user_id", user.id);
      setIsLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      await supabase
        .from("likes")
        .insert({ blog_id: id, user_id: user.id });
      setIsLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        blog_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (error) {
      toast.error("Failed to post comment");
      return;
    }

    setNewComment("");
    loadComments();
    toast.success("Comment posted!");
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete blog");
      return;
    }

    toast.success("Blog deleted");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {blog.cover_image && (
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full aspect-[2/1] object-cover rounded-lg mb-8"
          />
        )}

        <article className="prose prose-lg max-w-none mb-8">
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-4 mb-8 not-prose">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {blog.profiles.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{blog.profiles.username}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
              </div>
            </div>
            {user?.id === blog.user_id && (
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit/${blog.id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="whitespace-pre-wrap">{blog.content}</div>
        </article>

        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          <Button
            variant={isLiked ? "default" : "outline"}
            onClick={handleLike}
            className="gap-2"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            {comments.length}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Comments</h2>
          
          {user && (
            <div className="space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleComment}>Post Comment</Button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {comment.profiles.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{comment.profiles.username}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
