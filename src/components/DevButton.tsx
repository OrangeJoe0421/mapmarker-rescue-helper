
import { useState } from 'react';
import { Button } from './ui/button';
import { Server } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import DevDashboard from './DevDashboard';
import { toast } from 'sonner';

const DEV_PASSWORD = 'Ragnar'; // Using the same password as the application password gate

export function DevButton() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showDevDashboard, setShowDevDashboard] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === DEV_PASSWORD) {
      setShowPasswordDialog(false);
      setShowDevDashboard(true);
      setPassword('');
    } else {
      toast.error('Incorrect password');
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowPasswordDialog(true)}
        className="gap-2"
      >
        <Server className="h-4 w-4" />
        <span>Dev Tools</span>
      </Button>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Developer Authentication</DialogTitle>
            <DialogDescription>
              Enter the developer password to access admin tools.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter developer password"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Developer Dashboard */}
      <DevDashboard 
        isOpen={showDevDashboard} 
        onClose={() => setShowDevDashboard(false)} 
      />
    </>
  );
}
