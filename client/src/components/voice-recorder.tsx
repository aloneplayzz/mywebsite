import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface VoiceRecorderProps {
  onVoiceReady: (blob: Blob, url: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export function VoiceRecorder({
  onVoiceReady,
  onCancel,
  maxDuration = 60,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // Reset state
      setRecordingTime(0);
      chunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up timer for recording duration display
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // If reached max duration, stop recording
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone error",
        description: "Could not access your microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !audioUrl) return;
    
    setIsProcessing(true);
    
    // Simulate processing (in a real app, you might be uploading to a server)
    setTimeout(() => {
      onVoiceReady(audioBlob, audioUrl);
      setIsProcessing(false);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="text-sm font-medium">Voice Message</div>
      
      <div className="flex flex-col items-center gap-4">
        {/* Recording UI */}
        {isRecording && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="text-xl font-mono">{formatTime(recordingTime)}</div>
            <Progress 
              value={(recordingTime / maxDuration) * 100} 
              className="h-2 w-full"
            />
            <div className="text-xs text-muted-foreground">
              Recording... (Max: {formatTime(maxDuration)})
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        )}
        
        {/* Playback UI */}
        {audioUrl && !isRecording && (
          <div className="flex flex-col items-center gap-2 w-full">
            <audio 
              ref={audioRef}
              src={audioUrl} 
              controls 
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              {formatTime(recordingTime)} seconds
            </div>
            <div className="flex gap-2">
              {isProcessing ? (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                    }}
                  >
                    Discard
                  </Button>
                  <Button 
                    onClick={sendVoiceMessage}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Initial UI */}
        {!isRecording && !audioUrl && (
          <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg"
              className="rounded-full h-16 w-16"
              onClick={startRecording}
            >
              <Mic className="h-6 w-6" />
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Press the button to start recording
              <br />
              Maximum {maxDuration} seconds
            </div>
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}