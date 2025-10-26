import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface PlatformDetail {
  platform_name: string;
  payout_id?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  bank_account: BankAccount[] | null;
  commission_percentage: number;
  preferred_payout_currency: string;
  platform_details: PlatformDetail[] | null;
}

const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    commission_percentage: "0",
    preferred_payout_currency: "THB",
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState({ bank_name: "", account_number: "", account_name: "" });
  const [platformDetails, setPlatformDetails] = useState<PlatformDetail[]>([]);
  const [newPlatform, setNewPlatform] = useState({ platform_name: "", payout_id: "" });
  const { toast } = useToast();
  const navigate = useNavigate();

  const redirectToAuth = useCallback(() => {
    localStorage.removeItem("authToken");
    navigate("/auth");
  }, [navigate]);

  const getTokenOrRedirect = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      redirectToAuth();
      throw new Error("Authentication required");
    }
    return token;
  }, [redirectToAuth]);

  const handleAuthFailure = useCallback(() => {
    toast({
      title: "Session expired",
      description: "Please sign in again.",
      variant: "destructive",
    });
    redirectToAuth();
  }, [redirectToAuth, toast]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/clients");
      const data = await response.json();
      setClients((data || []) as Client[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetFormState = () => {
    setOpen(false);
    setEditingClient(null);
    setFormData({ name: "", phone: "", commission_percentage: "0", preferred_payout_currency: "THB" });
    setBankAccounts([]);
    setPlatformDetails([]);
    setNewBank({ bank_name: "", account_number: "", account_name: "" });
    setNewPlatform({ platform_name: "", payout_id: "" });
  };

  const submitClient = async (method: "POST" | "PUT", endpoint: string, payload: unknown) => {
    const response = await fetchWithAuth(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.message || "Request failed.";
      throw new Error(message);
    }

    return response.json().catch(() => null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        toast({
          title: "Missing name",
          description: "Client name is required.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const commissionValue = parseFloat(formData.commission_percentage);
      const safeCommission = Number.isFinite(commissionValue) ? commissionValue : 0;

      const clientData = {
        name: trimmedName,
        phone: formData.phone.trim() || null,
        bank_account: bankAccounts.length > 0 ? bankAccounts : null,
        platform_details: platformDetails.length > 0 ? platformDetails : null,
        commission_percentage: safeCommission,
        preferred_payout_currency: formData.preferred_payout_currency,
      };

      if (editingClient) {
        const result = await submitClient("PUT", `/api/clients/${editingClient.id}`, clientData);
        if (result === null) {
          return;
        }
        toast({ title: "Success", description: "Client updated successfully" });
      } else {
        const result = await submitClient("POST", "/api/clients", clientData);
        if (result === null) {
          return;
        }
        toast({ title: "Success", description: "Client added successfully" });
      }

      resetFormState();
      await fetchClients();
    } catch (error: any) {
      if (error.message !== "Authentication required") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || "",
      commission_percentage: client.commission_percentage.toString(),
      preferred_payout_currency: client.preferred_payout_currency,
    });
    setBankAccounts(client.bank_account || []);
    setPlatformDetails(client.platform_details || []);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || "Failed to delete client.";
        throw new Error(message);
      }

      toast({ title: "Success", description: "Client removed successfully" });
      await fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete client", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = () => {
    if (!newBank.bank_name || !newBank.account_number || !newBank.account_name) {
      toast({
        title: "Missing details",
        description: "Please fill in all bank account fields.",
        variant: "destructive",
      });
      return;
    }

    setBankAccounts(prev => [...prev, newBank]);
    setNewBank({ bank_name: "", account_number: "", account_name: "" });
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(prev => prev.filter((_, idx) => idx !== index));
  };

  const addPlatformDetail = () => {
    if (!newPlatform.platform_name) {
      toast({
        title: "Missing details",
        description: "Please provide a platform name.",
        variant: "destructive",
      });
      return;
    }
    setPlatformDetails(prev => [...prev, { platform_name: newPlatform.platform_name, payout_id: newPlatform.payout_id || undefined }]);
    setNewPlatform({ platform_name: "", payout_id: "" });
  };

  const removePlatformDetail = (index: number) => {
    setPlatformDetails(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Manage your clients and payout preferences</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                {editingClient ? "Edit Client" : "Add Client"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit client" : "Add new client"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission %</Label>
                    <Input
                      id="commission"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.commission_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select
                      value={formData.preferred_payout_currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_payout_currency: value }))}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">THB (Thai Baht)</SelectItem>
                        <SelectItem value="MMK">MMK (Myanmar Kyat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Bank Accounts</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBankAccount}>
                      Add bank
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Bank name"
                      value={newBank.bank_name}
                      onChange={(e) => setNewBank(prev => ({ ...prev, bank_name: e.target.value }))}
                    />
                    <Input
                      placeholder="Account number"
                      value={newBank.account_number}
                      onChange={(e) => setNewBank(prev => ({ ...prev, account_number: e.target.value }))}
                    />
                    <Input
                      placeholder="Account holder name"
                      value={newBank.account_name}
                      onChange={(e) => setNewBank(prev => ({ ...prev, account_name: e.target.value }))}
                    />
                  </div>
                  {bankAccounts.length > 0 && (
                    <div className="space-y-2">
                      {bankAccounts.map((account, index) => (
                        <div key={index} className="flex items-center justify_between rounded border p-2 text-sm">
                          <div>
                            <p className="font-medium">{account.bank_name}</p>
                            <p className="text-muted-foreground">{account.account_number}</p>
                            <p className="text-muted-foreground text-xs">{account.account_name}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeBankAccount(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify_between">
                    <Label>Platform Details</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPlatformDetail}>
                      Add platform
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Platform name"
                      value={newPlatform.platform_name}
                      onChange={(e) => setNewPlatform(prev => ({ ...prev, platform_name: e.target.value }))}
                    />
                    <Input
                      placeholder="Payout ID (optional)"
                      value={newPlatform.payout_id}
                      onChange={(e) => setNewPlatform(prev => ({ ...prev, payout_id: e.target.value }))}
                    />
                  </div>
                  {platformDetails.length > 0 && (
                    <div className="space-y-2">
                      {platformDetails.map((platform, index) => (
                        <div key={index} className="flex items-center justify_between rounded border p-2 text-sm">
                          <div>
                            <p className="font-medium">{platform.platform_name}</p>
                            {platform.payout_id && <p className="text-muted-foreground text-xs">{platform.payout_id}</p>}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removePlatformDetail(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingClient ? "Update Client" : "Add Client"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {loading ? "Loading clients..." : "No clients yet. Add your first client to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone || "—"}</TableCell>
                    <TableCell>
                      {client.bank_account && Array.isArray(client.bank_account) && client.bank_account.length > 0 ? (
                        <div className="space-y-1">
                          {client.bank_account.map((account, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{account.bank_name}:</span> {account.account_number}
                              <div className="text-xs text-muted-foreground">{account.account_name}</div>
                            </div>
                          ))}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {client.platform_details && Array.isArray(client.platform_details) && client.platform_details.length > 0 ? (
                        <div className="space-y-1">
                          {client.platform_details.map((platform, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{platform.platform_name}</span>
                              {platform.payout_id && <span>: {platform.payout_id}</span>}
                            </div>
                          ))}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{client.commission_percentage}%</TableCell>
                    <TableCell>{client.preferred_payout_currency}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientsTab;
