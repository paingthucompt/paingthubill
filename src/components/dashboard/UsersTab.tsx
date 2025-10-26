import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  role: string;
  subscription_status: string;
  subscription_end_date: string;
  created_at: string;
}

interface CreateUserFormData {
  email: string;
  password: string;
  role: string;
  subscription_days: number;
}

const UsersTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    role: 'user',
    subscription_days: 30,
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/users');

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create user');

      await fetchUsers();
      setIsCreateDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        role: 'user',
        subscription_days: 30,
      });
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Suspend user
  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}/suspend`, { method: 'PUT' });

      if (!response.ok) throw new Error('Failed to suspend user');

      await fetchUsers();
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  // Reactivate user
  const handleReactivateUser = async (userId: string, days: number = 30) => {
    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}/reactivate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_days: days }),
      });

      if (!response.ok) throw new Error('Failed to reactivate user');

      await fetchUsers();
      toast({
        title: "Success",
        description: "User reactivated successfully",
      });
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subscription Days</Label>
                <Input
                  type="number"
                  value={formData.subscription_days}
                  onChange={(e) => setFormData({ ...formData, subscription_days: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription End</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.subscription_status}</TableCell>
                <TableCell>
                  {new Date(user.subscription_end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.role !== 'admin' && (
                    user.subscription_status === 'active' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSuspendUser(user.id)}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReactivateUser(user.id)}
                      >
                        Reactivate
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersTab;