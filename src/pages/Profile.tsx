import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import BlogCard from "@/components/BlogCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit } from "lucide-react";

interface Profile {
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

interface BlogWithStats {
  id: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
  likes: { count: number }[];
  comments: { count: number }[];
}

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blogs, setBlogs] = useState<BlogWithStats[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      loadProfile();
      loadBlogs();
    }
  }, [id]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (data) {
      setProfile(data);
      setBio(data.bio || "");
      setUsername(data.username);
    }
  };

  const loadBlogs = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .eq("user_id", id)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (data) {
      // Load additional data for each blog
      const blogsWithStats = await Promise.all(
        data.map(async (blog) => {
          const [profileData, likesData, commentsData] = await Promise.all([
            supabase.from("profiles").select("username").eq("user_id", blog.user_id).single(),
            supabase.from("likes").select("id", { count: "exact", head: true }).eq("blog_id", blog.id),
            supabase.from("comments").select("id", { count: "exact", head: true }).eq("blog_id", blog.id),
          ]);

          return {
            ...blog,
            profiles: profileData.data || { username: "Unknown" },
            likes: [{ count: likesData.count || 0 }],
            comments: [{ count: commentsData.count || 0 }],
          };
        })
      );
      setBlogs(blogsWithStats);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bio: bio.trim(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    setEditing(false);
    loadProfile();
    toast.success("Profile updated!");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-4">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                    />
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{profile.username}</h1>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(true)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {profile.bio || "No bio yet"}
                    </p>
                    <div className="mt-4 flex gap-6 text-sm">
                      <div>
                        <span className="font-bold">{blogs.length}</span> posts
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-6">Published Posts</h2>
          {blogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No posts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  id={blog.id}
                  title={blog.title}
                  excerpt={blog.excerpt}
                  coverImage={blog.cover_image || undefined}
                  authorName={blog.profiles.username}
                  authorId={blog.user_id}
                  createdAt={blog.created_at}
                  likesCount={blog.likes[0]?.count || 0}
                  commentsCount={blog.comments[0]?.count || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
