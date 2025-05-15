import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  File, 
  X, 
  ImageIcon, 
  FileIcon,
  FileText,
  FileVideo,
  FileAudio,
  FilePlus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AttachmentUploadProps {
  onFileUpload: (file: File, url: string) => void;
  onCancel: () => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'application/pdf',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'video/mp4'
];

const DEFAULT_MAX_SIZE = 10; // 10MB

export function AttachmentUpload({ 
  onFileUpload, 
  onCancel,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSize = DEFAULT_MAX_SIZE 
}: AttachmentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    
    // Check file type
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: `Please upload one of the following types: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };
  
  // Simulate file upload with progress
  const handleUpload = () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // In a real implementation, this would be the URL returned from the server
          const fileUrl = URL.createObjectURL(file);
          onFileUpload(file, fileUrl);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Get file icon based on mimetype
  const getFileIcon = () => {
    if (!file) return <FilePlus />;
    
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.startsWith('audio/')) return <FileAudio />;
    if (file.type.startsWith('video/')) return <FileVideo />;
    if (file.type === 'application/pdf') return <FileText />;
    if (file.type === 'text/plain') return <FileText />;
    
    return <FileIcon />;
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <File className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Upload Attachment</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {file ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-md">
            {getFileIcon()}
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)}MB • {file.type}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {preview && (
            <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
              <img 
                src={preview} 
                alt="Preview" 
                className="object-contain w-full h-full"
              />
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Uploading: {progress}%
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
            >
              Upload
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept={allowedTypes.join(',')}
          />
          <div className="flex flex-col items-center gap-2">
            <File className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              Max file size: {maxSize}MB
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, GIF, PDF, MP3, MP4
            </p>
          </div>
        </div>
      )}
    </div>
  );
}