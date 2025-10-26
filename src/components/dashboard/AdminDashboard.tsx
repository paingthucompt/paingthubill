import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import UsersTab from './UsersTab';
import { fetchWithAuth } from '@/lib/auth';

const AdminDashboard = () => {
    const [users, setUsers] = React.useState([]);
    const [payments, setPayments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const [usersRes, paymentsRes] = await Promise.all([
                    fetchWithAuth('/api/admin/users'),
                    fetchWithAuth('/api/admin/payments'),
                ]);

                const [usersData, paymentsData] = await Promise.all([
                    usersRes.json(),
                    paymentsRes.json()
                ]);

                setUsers(usersData);
                setPayments(paymentsData);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'suspended':
                return 'bg-red-500';
            default:
                return 'bg-yellow-500';
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            
            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="stats">
                    <div className="grid gap-4">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium mb-4">Usage Statistics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold">{users.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold">
                                        {users.filter(u => u.subscription_status === 'active').length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Suspended Users</p>
                                    <p className="text-2xl font-bold">
                                        {users.filter(u => u.subscription_status === 'suspended').length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold">
                                        ${payments.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {payments.slice(0, 5).map((payment) => (
                                    <div key={payment.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{payment.user.email}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(payment.payment_date), 'PPP')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">${payment.amount}</p>
                                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                                {payment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;