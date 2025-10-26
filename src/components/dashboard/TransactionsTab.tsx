import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface PlatformDetail {
  platform_name: string;
  payout_id?: string;
}

interface Transaction {
  id: string;
  client_id: string;
  incoming_amount_thb: number;
  original_amount_usd: number | null;
  fees: number;
  transaction_date: string;
  notes: string | null;
  exchange_rate_mmk: number;
  payout_currency: string;
  payout_amount: number;
  source_platform: string | null;
  source_platform_payout_id: string | null;
  payment_destination: BankAccount | null;
  clients: {
    id: string;
    name: string;
    commission_percentage: number;
    preferred_payout_currency: string;
  };
}

interface Client {
  id: string;
  name: string;
  commission_percentage: number;
  preferred_payout_currency: string;
  platform_details: PlatformDetail[] | null;
  bank_account: BankAccount[] | null;
}

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: "",
    incoming_amount_thb: "",
    original_amount_usd: "",
    exchange_rate_mmk: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
    source_platform: "",
    payment_destination_index: "",
  });
  const [selectedClientPlatforms, setSelectedClientPlatforms] = useState<PlatformDetail[]>([]);
  const [selectedClientBankAccounts, setSelectedClientBankAccounts] = useState<BankAccount[]>([]);
  const [selectedClientCurrency, setSelectedClientCurrency] = useState<string>("");
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsResponse, clientsResponse] = await Promise.all([
        fetchWithAuth("/api/transactions"),
        fetchWithAuth("/api/clients"),
      ]);

      const [transactionsData, clientsData] = await Promise.all([
        transactionsResponse.json(),
        clientsResponse.json(),
      ]);

      setTransactions((transactionsData || []) as Transaction[]);
      setClients((clientsData || []) as Client[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFormState = () => {
    setEditingTransactionId(null);
    setFormData({
      client_id: "",
      incoming_amount_thb: "",
      original_amount_usd: "",
      exchange_rate_mmk: "",
      transaction_date: new Date().toISOString().split("T")[0],
      notes: "",
      source_platform: "",
      payment_destination_index: "",
    });
    setSelectedClientPlatforms([]);
    setSelectedClientBankAccounts([]);
    setSelectedClientCurrency("");
  };

  const handleDialogChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      resetFormState();
    }
  };

  const submitTransaction = async (method: "POST" | "PUT", endpoint: string, payload: unknown) => {
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
      const client = clients.find((c) => c.id === formData.client_id);
      if (!client) throw new Error("Client not found");

      const incomingAmountThb = parseFloat(formData.incoming_amount_thb);
      const exchangeRateMmk = parseFloat(formData.exchange_rate_mmk || "0");
      const originalAmountUsd = formData.original_amount_usd ? parseFloat(formData.original_amount_usd) : null;

      const commissionAmountThb = (incomingAmountThb * client.commission_percentage) / 100;
      const netPayableThb = incomingAmountThb - commissionAmountThb;

      const payoutCurrency = client.preferred_payout_currency;
      const payoutAmount = payoutCurrency === "MMK"
        ? netPayableThb * exchangeRateMmk
        : netPayableThb;

      let paymentDestination: BankAccount | null = null;
      if (formData.payment_destination_index && selectedClientBankAccounts.length > 0) {
        const bankIndex = parseInt(formData.payment_destination_index, 10);
        paymentDestination = selectedClientBankAccounts[bankIndex];
      }

      let sourcePlatformName: string | null = null;
      let sourcePlatformPayoutId: string | null = null;
      if (formData.source_platform && formData.source_platform !== "Other") {
        const platformIndex = parseInt(formData.source_platform, 10);
        const selectedPlatform = selectedClientPlatforms[platformIndex];
        if (selectedPlatform) {
          sourcePlatformName = selectedPlatform.platform_name;
          sourcePlatformPayoutId = selectedPlatform.payout_id || null;
        }
      } else if (formData.source_platform === "Other") {
        sourcePlatformName = "Other";
      }

      const transactionPayload = {
        client_id: formData.client_id,
        incoming_amount_thb: incomingAmountThb,
        original_amount_usd: originalAmountUsd,
        fees: 0,
        exchange_rate_mmk: exchangeRateMmk,
        payout_currency: payoutCurrency,
        payout_amount: payoutAmount,
        transaction_date: formData.transaction_date,
        notes: formData.notes || null,
        source_platform: sourcePlatformName,
        source_platform_payout_id: sourcePlatformPayoutId,
        payment_destination: paymentDestination,
      };

      const method: "POST" | "PUT" = editingTransactionId ? "PUT" : "POST";
      const endpoint = editingTransactionId
        ? `/api/transactions/${editingTransactionId}`
        : "/api/transactions";

      const result = await submitTransaction(method, endpoint, transactionPayload);
      if (result === null) {
        return;
      }

      toast({
        title: "Success",
        description: editingTransactionId ? "Transaction updated successfully" : "Transaction added successfully",
      });

      handleDialogChange(false);
      await fetchData();
    } catch (error: any) {
      if (error.message !== "Authentication required") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    const client = clients.find((c) => c.id === transaction.client_id);
    const clientPlatforms = client?.platform_details || [];
    const clientBanks = client?.bank_account || [];

    let sourcePlatformValue = "";
    if (transaction.source_platform) {
      const index = clientPlatforms.findIndex((platform) => platform.platform_name === transaction.source_platform);
      if (index >= 0) {
        sourcePlatformValue = index.toString();
      } else {
        sourcePlatformValue = "Other";
      }
    }

    let paymentDestinationIndex = "";
    if (transaction.payment_destination) {
      const index = clientBanks.findIndex(
        (bank) =>
          bank.bank_name === transaction.payment_destination?.bank_name &&
          bank.account_number === transaction.payment_destination?.account_number
      );
      if (index >= 0) {
        paymentDestinationIndex = index.toString();
      }
    }

    setEditingTransactionId(transaction.id);
    setFormData({
      client_id: transaction.client_id,
      incoming_amount_thb: transaction.incoming_amount_thb.toString(),
      original_amount_usd: transaction.original_amount_usd ? transaction.original_amount_usd.toString() : "",
      exchange_rate_mmk: transaction.exchange_rate_mmk ? transaction.exchange_rate_mmk.toString() : "",
      transaction_date: transaction.transaction_date.split("T")[0],
      notes: transaction.notes || "",
      source_platform: sourcePlatformValue,
      payment_destination_index: paymentDestinationIndex,
    });
    setSelectedClientPlatforms(clientPlatforms);
    setSelectedClientBankAccounts(clientBanks);
    setSelectedClientCurrency(client?.preferred_payout_currency || "");
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || "Failed to delete transaction.";
        throw new Error(message);
      }

      toast({ title: "Success", description: "Transaction deleted successfully" });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete transaction", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Track all client transactions</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button disabled={clients.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransactionId ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => {
                      const selectedClient = clients.find((c) => c.id === value);
                      setFormData((prev) => ({
                        ...prev,
                        client_id: value,
                        source_platform: "",
                        payment_destination_index: "",
                      }));
                      setSelectedClientPlatforms(selectedClient?.platform_details || []);
                      setSelectedClientBankAccounts(selectedClient?.bank_account || []);
                      setSelectedClientCurrency(selectedClient?.preferred_payout_currency || "");
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.commission_percentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_destination">Payment Destination Bank *</Label>
                  <Select
                    value={formData.payment_destination_index}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_destination_index: value }))}
                    disabled={!formData.client_id || selectedClientBankAccounts.length === 0}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedClientBankAccounts.length === 0
                            ? "No bank accounts available"
                            : "Select bank account"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientBankAccounts.map((bank, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {bank.bank_name} - ...{bank.account_number.slice(-4)} ({bank.account_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_platform">Source Platform</Label>
                  <Select
                    value={formData.source_platform}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, source_platform: value }))}
                    disabled={!formData.client_id || selectedClientPlatforms.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedClientPlatforms.length === 0
                            ? "No platforms available"
                            : "Select platform"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientPlatforms.map((platform, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {platform.platform_name}
                          {platform.payout_id ? ` (${platform.payout_id})` : ""}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other / Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_amount_usd">Original Amount (USD) *</Label>
                  <Input
                    id="original_amount_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_amount_usd}
                    onChange={(e) => setFormData((prev) => ({ ...prev, original_amount_usd: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incoming_amount_thb">Incoming Amount (THB) *</Label>
                  <Input
                    id="incoming_amount_thb"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.incoming_amount_thb}
                    onChange={(e) => setFormData((prev) => ({ ...prev, incoming_amount_thb: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate_mmk">
                    Exchange Rate (1 THB to MMK) {selectedClientCurrency === "MMK" && "*"}
                  </Label>
                  <Input
                    id="exchange_rate_mmk"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.exchange_rate_mmk}
                    onChange={(e) => setFormData((prev) => ({ ...prev, exchange_rate_mmk: e.target.value }))}
                    required={selectedClientCurrency === "MMK"}
                    placeholder="e.g., 120.00"
                    disabled={selectedClientCurrency === "THB"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Transaction Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transaction_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingTransactionId ? "Update Transaction" : "Add Transaction"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Please add clients first before creating transactions.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Payment Destination</TableHead>
                  <TableHead>Incoming (THB)</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Payout Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {loading ? "Loading transactions..." : "No transactions yet. Add your first transaction to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transaction_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{transaction.clients.name}</TableCell>
                      <TableCell>{transaction.source_platform || "—"}</TableCell>
                      <TableCell>
                        {transaction.payment_destination ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {transaction.payment_destination.bank_name} - {transaction.payment_destination.account_number}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(transaction.payment_destination!.account_number);
                                toast({
                                  title: "Copied!",
                                  description: "Account number copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>฿{transaction.incoming_amount_thb.toFixed(2)}</TableCell>
                      <TableCell>
                        {transaction.exchange_rate_mmk > 0
                          ? `1:${transaction.exchange_rate_mmk.toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {transaction.payout_currency === "MMK"
                          ? `${transaction.payout_amount.toFixed(2)} MMK`
                          : `฿${transaction.payout_amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
