import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mic, MicOff, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Chatroom = () => {
  const { field } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{id: string, text: string, sender: 'me' | 'partner'}>>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  
  const channelRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fieldName = field === "electronics" ? "Electronics" : "Computer Science";

  useEffect(() => {
    joinChatroom();
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      stopRecording();
    };
  }, [field]);

  const joinChatroom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const channel = supabase.channel(`chatroom-${field}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        
        if (users.length >= 2) {
          const otherUser = users.find(id => id !== user.id);
          if (otherUser) {
            setPartnerId(otherUser);
            setIsConnected(true);
            setIsWaiting(false);
            toast({
              title: "Connected!",
              description: "You're now connected to another user",
            });
          }
        } else {
          setIsWaiting(true);
          setIsConnected(false);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key !== user.id && !isConnected) {
          setPartnerId(key);
          setIsConnected(true);
          setIsWaiting(false);
          toast({
            title: "Connected!",
            description: "You're now connected to another user",
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === partnerId) {
          setIsConnected(false);
          setPartnerId(null);
          setIsWaiting(true);
          toast({
            title: "Disconnected",
            description: "Your partner left the chat",
          });
        }
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: payload.message,
          sender: 'partner'
        }]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, timestamp: Date.now() });
        }
      });

    channelRef.current = channel;
  };

  const sendMessage = () => {
    if (!message.trim() || !isConnected) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'me' as const
    };

    setMessages(prev => [...prev, newMessage]);
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: { message }
    });

    setMessage("");
  };

  const toggleMic = async () => {
    if (!isMicEnabled) {
      await startRecording();
    } else {
      stopRecording();
    }
    setIsMicEnabled(!isMicEnabled);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  };

  const findNewPartner = async () => {
    setIsConnected(false);
    setIsWaiting(true);
    setPartnerId(null);
    setMessages([]);
    
    // Leave current channel and rejoin
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
    }
    joinChatroom();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{fieldName} Chat</h1>
        </div>
        
        {isConnected && (
          <Button onClick={findNewPartner} variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Find New Partner
          </Button>
        )}
      </header>

      {/* Status */}
      <div className="p-4">
        {isWaiting ? (
          <Card className="text-center p-6">
            <CardContent>
              <div className="animate-pulse">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Waiting for someone to join...</p>
                <p className="text-muted-foreground">Looking for people interested in {fieldName}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center p-4 bg-primary/10 border-primary">
            <p className="text-primary font-medium">
              ✅ Connected to a {fieldName} enthusiast!
            </p>
          </Card>
        )}
      </div>

      {/* Chat Messages */}
      {isConnected && (
        <div className="flex-1 px-4 pb-4">
          <Card className="h-96 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Chat Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg max-w-xs ${
                    msg.sender === 'me'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      {isConnected && (
        <div className="p-4 border-t">
          <div className="flex gap-2 mb-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={toggleMic}
              variant={isMicEnabled ? "default" : "outline"}
              size="lg"
              className="flex items-center gap-2"
            >
              {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              {isMicEnabled ? "Mic On" : "Mic Off"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatroom;