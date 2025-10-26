import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, Receipt, FileText, Settings } from "lucide-react";
import ClientsTab from "@/components/dashboard/ClientsTab";
import TransactionsTab from "@/components/dashboard/TransactionsTab";
import InvoicesTab from "@/components/dashboard/InvoicesTab";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { jwtDecode } from "jwt-decode";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const decoded = jwtDecode<{ role: string }>(token);
      setIsAdmin(decoded.role === "admin");
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("authToken");
      navigate("/auth");
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  const handleSignOut = async () => {
    localStorage.removeItem("authToken");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Invoice Generator</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={isAdmin ? "admin" : "clients"} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin
              </TabsTrigger>
            )}
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}

          <TabsContent value="clients">
            <ClientsTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
