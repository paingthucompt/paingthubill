import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Image as ImageIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface PlatformDetail {
  platform_name: string;
  payout_id?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  transaction_id: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  clients: {
    id: string;
    name: string;
    phone: string | null;
    bank_account: BankAccount[] | null;
    commission_percentage: number;
    preferred_payout_currency: string;
    platform_details: PlatformDetail[] | null;
  };
  transactions: {
    incoming_amount_thb: number;
    original_amount_usd: number | null;
    fees: number;
    transaction_date: string;
    exchange_rate_mmk: number;
    payout_currency: string;
    payout_amount: number;
    source_platform: string | null;
    source_platform_payout_id: string | null;
    payment_destination: BankAccount | null;
  };
}

interface Transaction {
  id: string;
  incoming_amount_thb: number;
  fees: number;
  transaction_date: string;
  exchange_rate_mmk: number;
  payout_currency: string;
  payout_amount: number;
  clients: {
    id: string;
    name: string;
    commission_percentage: number;
    preferred_payout_currency: string;
  };
}

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState("");
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
      const [invoicesResponse, transactionsResponse] = await Promise.all([
        fetchWithAuth("/api/invoices"),
        fetchWithAuth("/api/transactions"),
      ]);

      const [invoicesData, transactionsData] = await Promise.all([
        invoicesResponse.json(),
        transactionsResponse.json(),
      ]);

      setInvoices((invoicesData || []) as Invoice[]);

      const invoicedTransactionIds = new Set(
        (invoicesData || []).map((invoice: Invoice) => invoice.transaction_id)
      );
      const availableTransactions = (transactionsData || []).filter(
        (transaction: Transaction) => !invoicedTransactionIds.has(transaction.id)
      );

      setTransactions(availableTransactions);
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

  const resetGeneratorState = () => {
    setSelectedTransaction("");
  };

  const generateInvoice = async () => {
    if (!selectedTransaction) return;

    setLoading(true);
    try {
      const transaction = transactions.find((t) => t.id === selectedTransaction);
      if (!transaction) throw new Error("Transaction not found");

      const commissionAmount = (transaction.incoming_amount_thb * transaction.clients.commission_percentage) / 100;
      const netAmount = transaction.incoming_amount_thb - commissionAmount - (transaction.fees || 0);

      const payload = {
        client_id: transaction.clients.id,
        transaction_id: transaction.id,
        total_amount: transaction.incoming_amount_thb,
        commission_amount: commissionAmount,
        net_amount: netAmount,
      };

      const response = await fetchWithAuth("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || "Failed to generate invoice.";
        throw new Error(message);
      }

      toast({ title: "Success", description: "Invoice generated successfully" });
      resetGeneratorState();
      setOpen(false);
      await fetchData();
    } catch (error: any) {
      if (error.message !== "Authentication required") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || "Failed to delete invoice.";
        throw new Error(message);
      }

      toast({ title: "Success", description: "Invoice removed successfully" });
      await fetchData();
    } catch (error: any) {
      if (error.message !== "Authentication required") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (invoice: Invoice) => {
    const container = document.getElementById("invoice-preview-content");
    if (!container) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    pdf.saveGraphicsState();
    pdf.setFontSize(40);
    pdf.setTextColor(240, 240, 240, 0.5);
    [
      { x: 40, y: 80, angle: -45 },
      { x: 150, y: 120, angle: -45 },
      { x: 50, y: 180, angle: -45 },
      { x: 140, y: 220, angle: -45 },
    ].forEach((wm) => {
      pdf.text("paingthu.com", wm.x, wm.y, { angle: wm.angle });
    });
    pdf.restoreGraphicsState();

    pdf.setFillColor(6, 182, 212);
    pdf.rect(0, 0, pageWidth, 35, "F");
    pdf.setFontSize(32);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PAING THU", pageWidth / 2, 23, { align: "center" });

    yPos = 50;
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text("INVOICE", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(invoice.invoice_number, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    pdf.text(format(new Date(invoice.created_at), "MMMM dd, yyyy"), pageWidth - margin, yPos, { align: "right" });
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text("support@paingthu.com", pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    pdf.text("+95 9 123 456 789", pageWidth - margin, yPos, { align: "right" });
    yPos += 12;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text("BILL TO", margin, yPos);
    yPos += 6;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(14);
    pdf.text(invoice.clients.name, margin, yPos);
    yPos += 6;
    if (invoice.clients.phone) {
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      pdf.text(invoice.clients.phone, margin, yPos);
      yPos += 6;
    }
    if (invoice.clients.bank_account && invoice.clients.bank_account.length > 0) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      invoice.clients.bank_account.forEach((account) => {
        pdf.text(`${account.bank_name}: ${account.account_number}`, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 10;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 70, "F");
    yPos += 12;

    const addRow = (label: string, value: string, highlight = false) => {
      pdf.setFontSize(highlight ? 12 : 10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(label, margin + 8, yPos);
      pdf.setTextColor(highlight ? 8 : 15, highlight ? 145 : 23, highlight ? 178 : 42);
      pdf.text(value, pageWidth - margin - 8, yPos, { align: "right" });
      yPos += highlight ? 10 : 8;
    };

    addRow("Incoming Amount (THB)", `฿${invoice.total_amount.toFixed(2)}`);
    addRow(`Commission (${invoice.clients.commission_percentage}%)`, `-฿${invoice.commission_amount.toFixed(2)}`);
    addRow("Fees", `-฿${invoice.transactions.fees.toFixed(2)}`);
    addRow("Net (THB)", `฿${invoice.net_amount.toFixed(2)}`);

    if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
      addRow(
        "Exchange Rate",
        `1 THB = ${invoice.transactions.exchange_rate_mmk.toFixed(2)} MMK`
      );
    }

    addRow(
      "Payout Amount",
      invoice.transactions.payout_currency === "MMK"
        ? `${invoice.transactions.payout_amount.toFixed(2)} MMK`
        : `฿${invoice.transactions.payout_amount.toFixed(2)}`,
      true
    );

    pdf.save(`${invoice.invoice_number}.pdf`);
  };

  const downloadImage = async (invoice: Invoice) => {
    const container = document.getElementById("invoice-preview-content");
    if (!container) return;

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${invoice.invoice_number}.png`;
    link.click();
  };

  const selectedTransactionDetails = transactions.find((t) => t.id === selectedTransaction);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Generate and manage client invoices</CardDescription>
          </div>
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                resetGeneratorState();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={transactions.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={selectedTransaction}
                  onValueChange={setSelectedTransaction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No transactions available
                      </SelectItem>
                    ) : (
                      transactions.map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          {transaction.clients.name} — ฿{transaction.incoming_amount_thb.toFixed(2)} (
                          {format(new Date(transaction.transaction_date), "MMM dd, yyyy")})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedTransactionDetails && (
                  <div className="rounded border bg-muted/30 p-4 text-sm space-y-1">
                    <p className="font-medium">{selectedTransactionDetails.clients.name}</p>
                    <p>Incoming: ฿{selectedTransactionDetails.incoming_amount_thb.toFixed(2)}</p>
                    <p>
                      Commission: {selectedTransactionDetails.clients.commission_percentage}% (
                      ฿{(
                        (selectedTransactionDetails.incoming_amount_thb *
                          selectedTransactionDetails.clients.commission_percentage) /
                        100
                      ).toFixed(2)}
                      )
                    </p>
                    <p>Fees: ฿{selectedTransactionDetails.fees.toFixed(2)}</p>
                  </div>
                )}

                <Button
                  onClick={generateInvoice}
                  disabled={!selectedTransaction || loading}
                  className="w-full"
                >
                  {loading ? "Generating..." : "Generate Invoice"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {loading ? "Loading invoices..." : "No invoices yet. Generate one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">
                        Transaction: {invoice.transactions.source_platform || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.clients.name}</TableCell>
                    <TableCell>฿{invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>฿{invoice.net_amount.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(invoice.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewInvoice(invoice)}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(invoice.id)}
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

      <Dialog open={!!previewInvoice} onOpenChange={(value) => !value && setPreviewInvoice(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-6">
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => downloadPDF(previewInvoice)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadImage(previewInvoice)}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
              </div>
              <div
                id="invoice-preview-content"
                className="space-y-6 p-6 bg-gradient-to-br from-card to-muted/20 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      INVOICE
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {previewInvoice.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(previewInvoice.created_at), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">BILL TO</p>
                  <p className="font-semibold text-lg">{previewInvoice.clients.name}</p>
                  {previewInvoice.clients.phone && (
                    <p className="text-sm text-muted-foreground">{previewInvoice.clients.phone}</p>
                  )}
                  {previewInvoice.clients.bank_account &&
                    Array.isArray(previewInvoice.clients.bank_account) &&
                    previewInvoice.clients.bank_account.length > 0 && (
                      <div className="space-y-1">
                        {previewInvoice.clients.bank_account.map((account, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {account.bank_name}: {account.account_number}
                          </p>
                        ))}
                      </div>
                    )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incoming Amount (THB)</span>
                    <span className="font-medium">฿{previewInvoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Commission ({previewInvoice.clients.commission_percentage}%)
                    </span>
                    <span className="font-medium text-destructive">
                      -฿{previewInvoice.commission_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium text-destructive">
                      -฿{previewInvoice.transactions.fees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net (THB)</span>
                    <span className="font-medium">฿{previewInvoice.net_amount.toFixed(2)}</span>
                  </div>
                  {previewInvoice.transactions.payout_currency === "MMK" &&
                    previewInvoice.transactions.exchange_rate_mmk > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Exchange Rate: 1 THB = {previewInvoice.transactions.exchange_rate_mmk.toFixed(2)} MMK
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-lg font-bold">Payout Amount</span>
                    <span className="text-lg font-bold text-primary">
                      {previewInvoice.transactions.payout_currency === "MMK"
                        ? `${previewInvoice.transactions.payout_amount.toFixed(2)} MMK`
                        : `฿${previewInvoice.transactions.payout_amount.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InvoicesTab;
