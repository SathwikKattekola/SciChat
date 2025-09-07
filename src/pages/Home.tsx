import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Zap, Monitor } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Profile */}
      <header className="flex justify-end p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="h-12 w-12"
        >
          <User className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Field Icons */}
        <div className="flex gap-16 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/chatroom/electronics")}
            className="flex flex-col items-center gap-4 p-8 h-auto hover:bg-accent/10 rounded-xl"
          >
            <div className="p-6 rounded-full bg-primary/10 border-2 border-primary">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <span className="text-lg font-medium">Electronics</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/chatroom/computer-science")}
            className="flex flex-col items-center gap-4 p-8 h-auto hover:bg-accent/10 rounded-xl"
          >
            <div className="p-6 rounded-full bg-primary/10 border-2 border-primary">
              <Monitor className="h-16 w-16 text-primary" />
            </div>
            <span className="text-lg font-medium">Computer Science</span>
          </Button>
        </div>

        {/* Info Box */}
        <Card className="max-w-2xl p-6 text-center mb-12">
          <p className="text-muted-foreground leading-relaxed">
            You can chat with people in two fields. Click the left icon to chat with people 
            interested in the field of electronics and on the right icon for those in the 
            field of computer science.
          </p>
        </Card>
      </div>

      {/* Quote at Bottom */}
      <footer className="flex justify-center pb-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary italic">
            "Let's make chatting productive"
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;