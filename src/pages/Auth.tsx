import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isFirstUserSetup, setIsFirstUserSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkFirstUserSetup = async () => {
      try {
        // Check if any user roles exist (if not, this is first-time setup)
        const { count, error } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error checking setup status:', error);
          setIsFirstUserSetup(false);
        } else {
          setIsFirstUserSetup(count === 0);
          if (count === 0) {
            setIsLogin(false); // Force signup mode for first user
          }
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
        setIsFirstUserSetup(false);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkFirstUserSetup();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/admin');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Sign Up Failed",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: isFirstUserSetup ? "Admin Account Created" : "Account Created",
            description: isFirstUserSetup 
              ? "You are now the admin. Signing you in..." 
              : "You can now sign in with your credentials.",
          });
          if (!isFirstUserSetup) {
            setIsLogin(true);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getTitle = () => {
    if (isFirstUserSetup) return 'Initial Setup';
    return isLogin ? 'Admin Login' : 'Admin Sign Up';
  };

  const getHeading = () => {
    if (isFirstUserSetup) return 'Welcome!';
    return isLogin ? 'Welcome Back' : 'Create Account';
  };

  const getSubheading = () => {
    if (isFirstUserSetup) return 'Create the first admin account to get started';
    return isLogin ? 'Sign in to access admin panel' : 'Sign up for admin access';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b border-border">
            {isFirstUserSetup ? (
              <Shield className="h-4 w-4 text-primary" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{getTitle()}</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isFirstUserSetup ? 'bg-primary/20' : 'bg-primary/10'
              }`}>
                {isFirstUserSetup ? (
                  <Shield className="h-8 w-8 text-primary" />
                ) : (
                  <Lock className="h-8 w-8 text-primary" />
                )}
              </div>
              <h1 className="text-xl font-semibold">{getHeading()}</h1>
              <p className="text-sm text-muted-foreground mt-1">{getSubheading()}</p>
              {isFirstUserSetup && (
                <p className="text-xs text-primary mt-2 font-medium">
                  This account will automatically become an admin
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? 'Please wait...' 
                : isFirstUserSetup 
                  ? 'Create Admin Account' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Sign Up'
              }
            </Button>

            {!isFirstUserSetup && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portfolio
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
