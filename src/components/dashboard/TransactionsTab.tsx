import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy } from "lucide-react";
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsResult, clientsResult] = await Promise.all([
        supabase
          .from("transactions")
          .select(`
            *,
            clients (name, commission_percentage, preferred_payout_currency)
          `)
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name, commission_percentage, preferred_payout_currency, platform_details, bank_account"),
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setTransactions((transactionsResult.data || []) as unknown as Transaction[]);
      setClients((clientsResult.data || []) as unknown as Client[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const client = clients.find(c => c.id === formData.client_id);
      if (!client) throw new Error("Client not found");

      const incomingAmountThb = parseFloat(formData.incoming_amount_thb);
      const exchangeRateMmk = parseFloat(formData.exchange_rate_mmk || "0");
      
      // Calculate commission and net
      const commissionAmountThb = (incomingAmountThb * client.commission_percentage) / 100;
      const netPayableThb = incomingAmountThb - commissionAmountThb;
      
      // Calculate payout based on currency
      const payoutCurrency = client.preferred_payout_currency;
      const payoutAmount = payoutCurrency === "MMK" ? netPayableThb * exchangeRateMmk : netPayableThb;

      // Get payment destination
      let paymentDestination = null;
      if (formData.payment_destination_index && selectedClientBankAccounts.length > 0) {
        const bankIndex = parseInt(formData.payment_destination_index);
        paymentDestination = selectedClientBankAccounts[bankIndex];
      }

      // Get source platform name and payout ID
      let sourcePlatformName = null;
      let sourcePlatformPayoutId = null;
      if (formData.source_platform && formData.source_platform !== "Other") {
        // formData.source_platform now contains index as string
        const platformIndex = parseInt(formData.source_platform);
        const selectedPlatform = selectedClientPlatforms[platformIndex];
        if (selectedPlatform) {
          sourcePlatformName = selectedPlatform.platform_name;
          sourcePlatformPayoutId = selectedPlatform.payout_id || null;
        }
      } else if (formData.source_platform === "Other") {
        sourcePlatformName = "Other";
      }

      const transactionData = {
        client_id: formData.client_id,
        incoming_amount_thb: incomingAmountThb,
        original_amount_usd: formData.original_amount_usd ? parseFloat(formData.original_amount_usd) : null,
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

      const { error } = await supabase.from("transactions").insert([transactionData]);
      if (error) throw error;

      toast({ title: "Success", description: "Transaction added successfully" });
      setOpen(false);
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
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={clients.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => {
                      const selectedClient = clients.find(c => c.id === value);
                      setFormData({ ...formData, client_id: value, source_platform: "", payment_destination_index: "" });
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
                    onValueChange={(value) => setFormData({ ...formData, payment_destination_index: value })}
                    disabled={!formData.client_id || selectedClientBankAccounts.length === 0}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedClientBankAccounts.length === 0 ? "No bank accounts available" : "Select bank account"} />
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
                    onValueChange={(value) => setFormData({ ...formData, source_platform: value })}
                    disabled={!formData.client_id || selectedClientPlatforms.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedClientPlatforms.length === 0 ? "No platforms available" : "Select platform"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClientPlatforms.map((platform, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {platform.platform_name}{platform.payout_id ? ` (${platform.payout_id})` : ''}
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
                    onChange={(e) => setFormData({ ...formData, original_amount_usd: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, incoming_amount_thb: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, exchange_rate_mmk: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Add Transaction"}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No transactions yet. Add your first transaction to get started.
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
