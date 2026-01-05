import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Upload, File, Trash2, Copy, Download, Lock, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface StoredFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchFiles();
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage.from('documents').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } else {
      setFiles((data || []).filter(f => f.name !== '.emptyFolderPlaceholder') as StoredFile[]);
    }
    setIsLoading(false);
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadProgress('Uploading...');
    
    for (const file of Array.from(fileList)) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('documents').upload(fileName, file);

      if (error) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Uploaded",
          description: `${file.name} uploaded successfully`,
        });
      }
    }

    setUploadProgress(null);
    fetchFiles();
  };

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage.from('documents').remove([fileName]);

    if (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "File removed successfully",
      });
      fetchFiles();
    }
  };

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const copyLink = async (fileName: string) => {
    const url = getPublicUrl(fileName);
    await navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  const downloadFile = async (fileName: string) => {
    const { data, error } = await supabase.storage.from('documents').download(fileName);
    
    if (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/^\d+_/, ''); // Remove timestamp prefix
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b border-border">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Admin Access</span>
            </div>
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-xl font-semibold">Document Manager</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter password to continue</p>
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Document Manager</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthenticated(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {uploadProgress || 'Drag and drop files here, or click to browse'}
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>

            {/* Files List */}
            <div>
              <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                <File className="h-4 w-4" />
                Uploaded Documents ({files.length})
              </h2>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <File className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name.replace(/^\d+_/, '')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.metadata?.size ? formatFileSize(file.metadata.size) : 'Unknown size'} •{' '}
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadFile(file.name)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(file.name)}
                          title="Copy Link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(file.name)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;
