import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

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

const Index = () => {
  const [blogs, setBlogs] = useState<BlogWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(20);

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
    setLoading(false);
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Share Your Stories with the World
            </h1>
            <p className="text-xl text-muted-foreground">
              Join our community of writers and readers. Create, publish, and discover amazing content.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
                Start Writing
              </Button>
              <Button size="lg" variant="outline">
                Explore Stories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="container mx-auto px-4 py-8 pb-16">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Latest Stories</h2>
        </div>

        {loading ? (
          <p className="text-center py-12">Loading...</p>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No blogs found matching your search" : "No blogs yet"}
            </p>
            <Button onClick={() => navigate("/create")}>
              Be the first to write
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
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
      </section>
    </div>
  );
};

export default Index;
