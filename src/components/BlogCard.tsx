import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

const BlogCard = ({
  id,
  title,
  excerpt,
  coverImage,
  authorName,
  createdAt,
  likesCount,
  commentsCount,
}: BlogCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 group">
      <Link to={`/blog/${id}`}>
        {coverImage && (
          <div className="aspect-[2/1] overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground line-clamp-2 mt-2">
            {excerpt}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {authorName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{authorName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {likesCount}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {commentsCount}
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default BlogCard;
