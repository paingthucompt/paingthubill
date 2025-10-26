import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  Receipt, 
  Calculator, 
  Globe, 
  Lock,
  Wallet,
  Download,
  TrendingUp,
  DollarSign
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // If we already have our own auth token (backend JWT), prefer that and avoid importing Supabase
      const localToken = localStorage.getItem("authToken");
      if (localToken) {
        navigate("/dashboard");
        return;
      }

      // No external auth client here — the app uses the custom backend JWT stored in localStorage.
    };
    checkAuth();
  }, [navigate]);

  const features = [
    {
      icon: Users,
      title: "Client Management",
      description: "Organize clients with custom commission rates, preferred currencies (THB/MMK), and multiple bank account details for seamless payouts."
    },
    {
      icon: Receipt,
      title: "Transaction Tracking",
      description: "Record incoming THB amounts, processing fees, and exchange rates for each transaction with automatic net calculations."
    },
    {
      icon: Calculator,
      title: "Smart Payout Calculation",
      description: "Automatically calculate final payout amounts in THB or MMK based on client preferences, including commission deductions."
    },
    {
      icon: FileText,
      title: "Professional Invoices",
      description: "Generate polished, branded invoices with detailed breakdowns of amounts, commissions, and conversion rates."
    },
    {
      icon: Download,
      title: "Dual Download Options",
      description: "Export invoices as high-quality PDF or JPEG files, perfect for sharing via email or messaging apps."
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Handle THB and MMK currencies effortlessly with real-time conversion tracking and flexible payment options."
    },
    {
      icon: Wallet,
      title: "Bank Account Management",
      description: "Store multiple bank accounts per client for different currencies and payment destinations with secure data handling."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "All your client data and transactions are encrypted and accessible only through your secure account."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl shadow-xl mb-6 animate-fade-in">
              <FileText className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in leading-tight">
              Streamline Your Client Payouts
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The complete invoice management solution for freelancers and small businesses handling multi-currency client payments across Thailand and Myanmar.
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              Manage clients, track transactions, calculate commissions, and generate professional invoices—all in one secure platform designed for THB and MMK operations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-10 py-7 hover:scale-105 transition-all"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Manage Payouts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built specifically for cross-border payment workflows with powerful automation and beautiful invoice generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 mb-16">
        <Card className="max-w-4xl mx-auto border-2 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <TrendingUp className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">
              Ready to Simplify Your Payout Process?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join today and start managing clients, tracking transactions, and generating professional invoices in minutes. No credit card required.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Create Your Free Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Invoice Generator. All rights reserved.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              <Button
                variant="link"
                onClick={() => navigate("/about")}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                About Us
              </Button>
              <Button
                variant="link"
                onClick={() => navigate("/policy")}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Button>
              <Button
                variant="link"
                onClick={() => navigate("/contact")}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Contact Us
              </Button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
