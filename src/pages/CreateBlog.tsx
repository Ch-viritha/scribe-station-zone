import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";

const CreateBlog = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (id) {
      loadBlog();
    }
  }, [user, id, navigate]);

  const loadBlog = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load blog");
      return;
    }

    setTitle(data.title);
    setExcerpt(data.excerpt || "");
    setContent(data.content);
    setCoverImage(data.cover_image || "");
  };

  const handleSave = async (publish: boolean = false) => {
    if (!user) return;
    
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    if (publish) setPublishing(true);

    try {
      const blogData = {
        title: title.trim(),
        excerpt: excerpt.trim() || content.substring(0, 150),
        content: content.trim(),
        cover_image: coverImage.trim() || null,
        published: publish,
        user_id: user.id,
      };

      if (id) {
        const { error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", id);

        if (error) throw error;
        toast.success(publish ? "Blog published!" : "Blog updated!");
      } else {
        const { data, error } = await supabase
          .from("blogs")
          .insert([blogData])
          .select()
          .single();

        if (error) throw error;
        toast.success(publish ? "Blog published!" : "Blog saved as draft!");
        navigate(`/blog/${data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog");
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle>{id ? "Edit Blog" : "Create New Blog"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your blog title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Optional)</Label>
              <Input
                id="excerpt"
                placeholder="Brief description of your blog..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
              <Input
                id="coverImage"
                placeholder="https://example.com/image.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] resize-none"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={loading || publishing}
              >
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateBlog;
