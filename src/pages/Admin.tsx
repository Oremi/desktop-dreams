import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Upload, File, Trash2, Copy, Download, LogOut, X, Link2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface StoredFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (error) {
      setIsAdmin(false);
    } else {
      setIsAdmin(data === true);
      if (data === true) {
        fetchFiles();
      }
    }
    setIsLoading(false);
  };

  const fetchFiles = async () => {
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
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadProgress('Uploading...');
    
    for (const file of Array.from(fileList)) {
      const fileName = `${crypto.randomUUID()}_${file.name}`;
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

  const getSignedUrl = async (fileName: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (error) {
      toast({
        title: "Error",
        description: "Failed to generate link",
        variant: "destructive",
      });
      return null;
    }
    return data.signedUrl;
  };

  const copyLink = async (fileName: string) => {
    const url = await getSignedUrl(fileName);
    if (url) {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied",
        description: "Signed link copied (expires in 1 hour)",
      });
    }
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
    a.download = fileName.replace(/^[a-f0-9-]+_/, ''); // Remove UUID prefix
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b border-border">
              <Shield className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Access Denied</span>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Admin Access Required</h1>
              <p className="text-sm text-muted-foreground mb-6">
                You don't have permission to access this area. Please contact the administrator.
              </p>
              <div className="space-y-2">
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
                  Back to Portfolio
                </Button>
              </div>
            </div>
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
              <span className="text-xs text-muted-foreground">({user.email})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
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

              {files.length === 0 ? (
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
                            {file.name.replace(/^[a-f0-9-]+_/, '')}
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
                          title="Copy signed link (1hr)"
                        >
                          <Link2 className="h-4 w-4" />
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
