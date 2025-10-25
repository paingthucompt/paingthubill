import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, Globe, Calculator, Users, Target, Sparkles } from "lucide-react";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">About Invoice Generator</CardTitle>
              </div>
              <CardDescription>
                Simplifying multi-currency payout management for freelancers and small businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Our Purpose
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Invoice Generator is a specialized tool designed for freelancers, agencies, and small businesses 
                  that manage international client payouts, particularly focusing on Thai Baht (THB) to Myanmar Kyat (MMK) 
                  currency conversions. We understand the complexity of handling multi-currency transactions, commission tracking, 
                  and the need for professional invoice documentation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  What We Do
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our application streamlines the entire payout process, from transaction recording to invoice generation. 
                  Whether you're managing a handful of clients or dozens, Invoice Generator helps you:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Track client information with custom commission rates and preferred currencies (THB/MMK)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Record incoming transactions with automatic fee calculations and exchange rate tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Store multiple bank accounts per client for flexible payment distribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Generate professional invoices instantly in both PDF and JPEG formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Maintain accurate historical records of all transactions and payouts</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who It's For
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This tool is perfect for anyone who needs to manage client payouts across different currencies, 
                  particularly those working between Thailand and Myanmar markets. Whether you're a freelance agent, 
                  digital agency, remittance service provider, or any business handling international payments, 
                  Invoice Generator provides the structure and automation you need.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Key Features
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Smart Calculations</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatic commission deductions, fee calculations, and currency conversions at specified exchange rates
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Flexible Client Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Store multiple bank accounts per client and customize commission rates individually
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Professional Invoices</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate detailed invoices with your branding, complete breakdowns, and multiple download formats
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is protected with authentication and user-specific access controls
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Our Commitment
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We're committed to making international payout management simple, accurate, and efficient. 
                  Our goal is to save you time on administrative tasks so you can focus on growing your business. 
                  We continuously improve the application based on user feedback and evolving business needs.
                </p>
              </section>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Have questions or feedback? We'd love to hear from you! Visit our 
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/contact")}
                    className="px-1 h-auto"
                  >
                    Contact Us
                  </Button>
                  page to get in touch.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Technology & Transparency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Invoice Generator is built using modern web technologies to ensure reliability, security, and performance. 
                All your data is encrypted and stored securely with industry-standard security practices.
              </p>
              <p>
                We believe in transparency. For more information about how we handle your data, please review our 
                <Button 
                  variant="link" 
                  onClick={() => navigate("/policy")}
                  className="px-1 h-auto text-sm"
                >
                  Privacy Policy
                </Button>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
