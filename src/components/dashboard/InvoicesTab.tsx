import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Image as ImageIcon } from "lucide-react";
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
  payout_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  clients: {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesResult, allTransactionsResult] = await Promise.all([
        supabase
          .from("invoices")
          .select(`
            *,
            clients (name, phone, bank_account, commission_percentage, preferred_payout_currency, platform_details),
            transactions (incoming_amount_thb, original_amount_usd, fees, transaction_date, exchange_rate_mmk, payout_currency, payout_amount, source_platform, source_platform_payout_id, payment_destination)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select(`
            id,
            incoming_amount_thb,
            fees,
            transaction_date,
            exchange_rate_mmk,
            payout_currency,
            payout_amount,
            clients (id, name, commission_percentage, preferred_payout_currency)
          `),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (allTransactionsResult.error) throw allTransactionsResult.error;

      const invoicesData = (invoicesResult.data || []) as unknown as Invoice[];
      const allTransactions = allTransactionsResult.data || [];
      
      // Filter out transactions that already have invoices
      const invoicedTransactionIds = new Set(invoicesData.map(inv => (inv as any).transaction_id));
      const availableTransactions = allTransactions.filter(t => !invoicedTransactionIds.has(t.id));

      setInvoices(invoicesData);
      setTransactions(availableTransactions);
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

  const generateInvoice = async () => {
    if (!selectedTransaction) return;

    setLoading(true);
    try {
      const transaction = transactions.find((t) => t.id === selectedTransaction);
      if (!transaction) throw new Error("Transaction not found");

      const commissionAmount = (transaction.incoming_amount_thb * transaction.clients.commission_percentage) / 100;
      const netAmount = transaction.incoming_amount_thb - commissionAmount - transaction.fees;

      const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

      const { error } = await supabase.from("invoices").insert([
        {
          client_id: transaction.clients.id,
          transaction_id: transaction.id,
          invoice_number: invoiceNumber,
          total_amount: transaction.incoming_amount_thb,
          commission_amount: commissionAmount,
          net_amount: netAmount,
        },
      ]);

      if (error) throw error;

      toast({ title: "Success", description: "Invoice generated successfully" });
      setOpen(false);
      setSelectedTransaction("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (invoice: Invoice) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;

    // Add watermarks (diagonal paingthu.com text) - very faint
    pdf.saveGraphicsState();
    pdf.setFontSize(40);
    pdf.setTextColor(240, 240, 240, 0.5); // Very light grey, semi-transparent
    
    // Watermark positions
    const watermarks = [
      { x: 40, y: 80, angle: -45 },
      { x: 150, y: 120, angle: -45 },
      { x: 50, y: 180, angle: -45 },
      { x: 140, y: 220, angle: -45 },
    ];
    
    watermarks.forEach(wm => {
      pdf.text("paingthu.com", wm.x, wm.y, { angle: wm.angle });
    });
    
    // Reset for main content
    pdf.restoreGraphicsState();

    // Gradient-style header (simulated with colored rectangle)
    pdf.setFillColor(6, 182, 212);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Company Name in header
    pdf.setFontSize(32);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PAING THU", pageWidth / 2, 23, { align: "center" });

    yPos = 50;

    // INVOICE Title and Details (Right Side)
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text("INVOICE", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;

    // Invoice Number and Date
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(invoice.invoice_number, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
    pdf.text(format(new Date(invoice.created_at), "MMMM dd, yyyy"), pageWidth - margin, yPos, { align: "right" });
    
    // Contact Info (below invoice details on right)
    yPos += 10;
    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);
    pdf.text("+6691 333 7003", pageWidth - margin, yPos, { align: "right" });
    yPos += 5;
    pdf.text("https://www.paingthu.com", pageWidth - margin, yPos, { align: "right" });
    yPos += 5;
    pdf.text("Nakhon Pathom, Thailand", pageWidth - margin, yPos, { align: "right" });

    // Bill To Section (Left Side)
    yPos = 50;
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text("BILL TO", margin, yPos);
    yPos += 8;
    
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text(invoice.clients.name, margin, yPos);
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);
    if (invoice.clients.phone) {
      pdf.text(`Phone: ${invoice.clients.phone}`, margin, yPos);
      yPos += 6;
    }

    // Display only payment destination bank
    if (invoice.transactions.payment_destination) {
      const account = invoice.transactions.payment_destination;
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`${account.bank_name}: ${account.account_number}`, margin, yPos);
      yPos += 6;
      if (account.account_name) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(account.account_name, margin, yPos);
        yPos += 6;
      }
    } else {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Bank Not Specified", margin, yPos);
      yPos += 6;
    }

    yPos = 105;

    // Transaction Details Box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 38, 'F');
    
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text("TRANSACTION DETAILS", margin + 5, yPos);
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Transaction Date: ${format(new Date(invoice.transactions.transaction_date), "MMMM dd, yyyy")}`, margin + 5, yPos);
    yPos += 5;

    if (invoice.transactions.source_platform) {
      pdf.text(`Source Platform: ${invoice.transactions.source_platform}`, margin + 5, yPos);
      yPos += 5;

      // Get the payout ID - either from stored value or lookup from platform_details
      let payoutId = invoice.transactions.source_platform_payout_id;
      if (!payoutId && invoice.clients.platform_details) {
        const platformDetail = invoice.clients.platform_details.find(
          p => p.platform_name === invoice.transactions.source_platform
        );
        payoutId = platformDetail?.payout_id || null;
      }

      pdf.text(`Payout ID: ${payoutId || 'N/A'}`, margin + 5, yPos);
      yPos += 5;
    }

    pdf.text(`Payout Currency: ${invoice.transactions.payout_currency}`, margin + 5, yPos);
    yPos += 5;

    if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
      pdf.text(`Exchange Rate: 1 THB = ${invoice.transactions.exchange_rate_mmk.toFixed(2)} MMK`, margin + 5, yPos);
    }

    yPos += 13;

    // Amounts Table Header
    pdf.setFillColor(30, 41, 59);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Description", margin + 5, yPos + 7);
    pdf.text("Amount", pageWidth - margin - 5, yPos + 7, { align: "right" });
    
    yPos += 10;

    // Table rows
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    
    if (invoice.transactions.original_amount_usd) {
      pdf.setTextColor(0, 0, 0); // Label in black
      pdf.text("Original Amount (USD)", margin + 5, yPos + 6);
      pdf.setTextColor(0, 128, 0); // Amount in green
      pdf.text(`$${invoice.transactions.original_amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, pageWidth - margin - 5, yPos + 6, { align: "right" });
      yPos += 8;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 2;
    }

    yPos += 6;
    pdf.setTextColor(0, 0, 0); // Label in black
    pdf.text("Incoming Amount (THB)", margin + 5, yPos);
    pdf.setTextColor(0, 128, 0); // Amount in green
    pdf.text(`${invoice.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 8;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;
    pdf.setTextColor(0, 0, 0); // Label in black
    pdf.text(`Commission (${invoice.clients.commission_percentage}%)`, margin + 5, yPos);
    pdf.setTextColor(220, 38, 38); // Amount in red
    pdf.text(`-${invoice.commission_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB`, pageWidth - margin - 5, yPos, { align: "right" });
    pdf.setTextColor(0, 0, 0); // Reset to black
    yPos += 8;
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;
    pdf.setTextColor(0, 0, 0); // Keep net amount in default black
    pdf.text("Net in THB", margin + 5, yPos);
    pdf.text(`${invoice.net_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 8;
    pdf.setLineWidth(1);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    // Add conversion row if MMK
    if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
      yPos += 8;
      const conversionAmount = invoice.net_amount * invoice.transactions.exchange_rate_mmk;
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Conversion (${invoice.net_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB x ${invoice.transactions.exchange_rate_mmk.toFixed(2)})`, margin + 5, yPos);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`${conversionAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MMK`, pageWidth - margin - 5, yPos, { align: "right" });
      yPos += 8;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
    }

    yPos += 15;

    // Payout Amount Box (gradient simulation with purple)
    pdf.setFillColor(99, 102, 241);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 16, 'F');
    
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PAYOUT AMOUNT", margin + 5, yPos + 11);
    
    const payoutDisplay = invoice.transactions.payout_currency === "MMK" 
      ? `${invoice.transactions.payout_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MMK`
      : `${invoice.transactions.payout_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB`;
    
    pdf.setFontSize(14);
    pdf.text(payoutDisplay, pageWidth - margin - 5, yPos + 11, { align: "right" });

    yPos += 26;

    // Thank you note
    pdf.setFontSize(10);
    pdf.setTextColor(99, 102, 241);
    pdf.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });

    pdf.save(`${invoice.invoice_number}.pdf`);

    toast({
      title: "Success",
      description: "Invoice PDF downloaded successfully",
    });
  };

  const downloadJPEG = async (invoice: Invoice) => {
    try {
      // Create a hidden container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1800px';
      container.style.minHeight = '2545px'; // A4 proportion (1:1.414)
      container.style.background = 'white';
      container.style.padding = '80px';
      container.style.fontFamily = 'Arial, sans-serif';
      
      // Build the invoice HTML
      let platformInfo = '';
      if (invoice.transactions.source_platform) {
        platformInfo += `<div style="margin: 10px 0; font-size: 28px; color: #1e293b;"><strong>Source Platform:</strong> ${invoice.transactions.source_platform}</div>`;
        
        // Get the payout ID - either from stored value or lookup from platform_details
        let payoutId = invoice.transactions.source_platform_payout_id;
        if (!payoutId && invoice.clients.platform_details) {
          const platformDetail = invoice.clients.platform_details.find(
            p => p.platform_name === invoice.transactions.source_platform
          );
          payoutId = platformDetail?.payout_id || null;
        }

        platformInfo += `<div style="margin: 10px 0; font-size: 28px; color: #1e293b;"><strong>Payout ID:</strong> ${payoutId || 'N/A'}</div>`;
      }

      let bankAccountsHTML = '';
      if (invoice.transactions.payment_destination) {
        const account = invoice.transactions.payment_destination;
        bankAccountsHTML = `
          <div style="margin: 6px 0;">
            <div style="font-size: 28px; color: #1e293b; font-weight: 600;">${account.bank_name}: ${account.account_number}</div>
            <div style="font-size: 26px; color: #64748b;">${account.account_name || ''}</div>
          </div>`;
      } else {
        bankAccountsHTML = '<div style="font-size: 28px; color: #64748b;">Bank Not Specified</div>';
      }

      let originalAmountRow = '';
      if (invoice.transactions.original_amount_usd) {
        originalAmountRow = `
          <tr>
            <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 28px; color: #000000;">Original Amount (USD)</td>
            <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 46px; color: #16a34a;">$${invoice.transactions.original_amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        `;
      }

      let exchangeRateRow = '';
      if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
        exchangeRateRow = `<div style="margin: 10px 0; font-size: 28px; color: #1e293b;"><strong>Exchange Rate:</strong> 1 THB = ${invoice.transactions.exchange_rate_mmk.toFixed(2)} MMK</div>`;
      }

      const payoutDisplay = invoice.transactions.payout_currency === "MMK" 
        ? `${invoice.transactions.payout_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MMK`
        : `${invoice.transactions.payout_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB`;

      // Conversion row for MMK
      let conversionRow = '';
      if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
        const conversionAmount = invoice.net_amount * invoice.transactions.exchange_rate_mmk;
        conversionRow = `
          <tr>
            <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 28px; color: #64748b;">Conversion (${invoice.net_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB x ${invoice.transactions.exchange_rate_mmk.toFixed(2)})</td>
            <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 46px; color: #1e293b;">${conversionAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MMK</td>
          </tr>
        `;
      }

      container.innerHTML = `
        <div style="max-width: 1800px; margin: 0 auto; position: relative; min-height: 2545px;">
          <!-- Watermarks - More visible -->
          <div style="position: absolute; top: 15%; left: 10%; transform: rotate(-45deg); font-size: 64px; font-weight: bold; color: rgba(6, 182, 212, 0.2); z-index: 0; white-space: nowrap;">paingthu.com</div>
          <div style="position: absolute; top: 30%; right: 15%; transform: rotate(-45deg); font-size: 64px; font-weight: bold; color: rgba(6, 182, 212, 0.2); z-index: 0; white-space: nowrap;">paingthu.com</div>
          <div style="position: absolute; top: 50%; left: 20%; transform: rotate(-45deg); font-size: 64px; font-weight: bold; color: rgba(6, 182, 212, 0.2); z-index: 0; white-space: nowrap;">paingthu.com</div>
          <div style="position: absolute; top: 65%; right: 10%; transform: rotate(-45deg); font-size: 64px; font-weight: bold; color: rgba(6, 182, 212, 0.2); z-index: 0; white-space: nowrap;">paingthu.com</div>
          <div style="position: absolute; top: 80%; left: 15%; transform: rotate(-45deg); font-size: 64px; font-weight: bold; color: rgba(6, 182, 212, 0.2); z-index: 0; white-space: nowrap;">paingthu.com</div>

          <!-- Content with higher z-index -->
          <div style="position: relative; z-index: 1;">
            <!-- Header with gradient background -->
            <div style="position: relative; height: 260px; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); border-radius: 12px; overflow: hidden; margin-bottom: 100px; display: flex; align-items: center; justify-content: center;">
              <div style="font-size: 120px; font-weight: bold; color: rgba(255, 255, 255, 0.95); text-shadow: 2px 2px 4px rgba(0,0,0,0.3); letter-spacing: 4px;">PAING THU</div>
            </div>

          <!-- Invoice Details Row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 100px;">
            <div style="flex: 1;">
              <div style="font-size: 32px; color: #475569; margin-bottom: 12px; font-weight: bold;">BILL TO:</div>
              <div style="font-size: 40px; font-weight: bold; margin-bottom: 16px; color: #000000;">${invoice.clients.name}</div>
              ${invoice.clients.phone ? `<div style="font-size: 28px; color: #1e293b; margin: 6px 0;">Phone: ${invoice.clients.phone}</div>` : ''}
              ${bankAccountsHTML ? `<div style="font-size: 28px; color: #1e293b;">${bankAccountsHTML}</div>` : ''}
            </div>
            <div style="text-align: right; flex: 1;">
              <div style="font-size: 72px; font-weight: bold; color: #000000; margin-bottom: 12px;">INVOICE</div>
              <div style="font-size: 32px; color: #1e293b; margin-bottom: 8px; font-weight: 600;">${invoice.invoice_number}</div>
              <div style="font-size: 28px; color: #1e293b; margin-bottom: 24px;">${format(new Date(invoice.created_at), "MMMM dd, yyyy")}</div>
              <div style="font-size: 28px; color: #1e293b; line-height: 1.8;">
                <div>+6691 333 7003</div>
                <div>https://www.paingthu.com</div>
                <div>Nakhon Pathom, Thailand</div>
              </div>
            </div>
          </div>

          <!-- Transaction Details -->
          <div style="margin-bottom: 80px; padding: 28px; background: #f8fafc; border-radius: 8px;">
            <div style="font-size: 34px; font-weight: bold; margin-bottom: 18px; color: #000000;">TRANSACTION DETAILS</div>
            <div style="margin: 10px 0; font-size: 28px; color: #1e293b;"><strong>Transaction Date:</strong> ${format(new Date(invoice.transactions.transaction_date), "MMMM dd, yyyy")}</div>
            ${platformInfo}
            <div style="margin: 10px 0; font-size: 28px; color: #1e293b;"><strong>Payout Currency:</strong> ${invoice.transactions.payout_currency}</div>
            ${exchangeRateRow}
          </div>

          <!-- Amounts Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 80px;">
            <thead>
              <tr style="background: #1e293b;">
                <th style="padding: 24px; text-align: left; color: white; font-size: 32px; font-weight: bold;">Description</th>
                <th style="padding: 24px; text-align: right; color: white; font-size: 32px; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${originalAmountRow}
              <tr>
                <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 28px; color: #000000;">Incoming Amount (THB)</td>
                <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 46px; color: #16a34a;">${invoice.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB</td>
              </tr>
              <tr>
                <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 28px; color: #000000;">Commission (${invoice.clients.commission_percentage}%)</td>
                <td style="padding: 20px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 46px; color: #dc2626;">-${invoice.commission_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB</td>
              </tr>
              <tr>
                <td style="padding: 20px; border-bottom: 2px solid #1e293b; font-weight: bold; font-size: 28px; color: #000000;">Net in THB</td>
                <td style="padding: 20px; border-bottom: 2px solid #1e293b; text-align: right; font-weight: bold; font-size: 46px; color: #000000;">${invoice.net_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} THB</td>
              </tr>
              ${conversionRow}
            </tbody>
          </table>

          <!-- Payout Amount -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 36px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; margin-bottom: 100px;">
            <div style="font-size: 50px; font-weight: bold; color: white;">PAYOUT AMOUNT</div>
            <div style="font-size: 58px; font-weight: bold; color: white;">${payoutDisplay}</div>
          </div>

          <!-- Thank You -->
          <div style="text-align: center; font-size: 34px; color: #6366f1; font-weight: 600; padding-top: 60px;">
            Thank you for your business!
          </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Capture as image with higher resolution
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
      });

      // Remove container
      document.body.removeChild(container);

      // Convert to JPEG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${invoice.invoice_number}.jpg`;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: "Success",
            description: "Invoice JPEG downloaded successfully",
          });
        }
      }, 'image/jpeg', 0.95);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Generate and manage invoices</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} disabled={transactions.length === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 && invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions available. Add transactions first to generate invoices.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices yet. Generate your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium">{invoice.clients.name}</TableCell>
                      <TableCell>{format(new Date(invoice.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-destructive">
                        -${invoice.commission_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ${invoice.net_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewInvoice(invoice)}
                          title="Preview Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPDF(invoice)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadJPEG(invoice)}
                          title="Download JPEG"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Transaction</label>
                <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.clients.name} - ฿{transaction.incoming_amount_thb.toFixed(2)} (
                        {format(new Date(transaction.transaction_date), "MMM dd, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={generateInvoice}
                className="w-full"
                disabled={!selectedTransaction || loading}
              >
                {loading ? "Generating..." : "Generate Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {previewInvoice && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-card to-muted/20 rounded-lg">
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
                  {previewInvoice.clients.bank_account && Array.isArray(previewInvoice.clients.bank_account) && previewInvoice.clients.bank_account.length > 0 && (
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
                  {previewInvoice.transactions.payout_currency === "MMK" && previewInvoice.transactions.exchange_rate_mmk > 0 && (
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
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InvoicesTab;
