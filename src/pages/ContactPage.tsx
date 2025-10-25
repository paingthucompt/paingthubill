import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Clock, HelpCircle } from "lucide-react";

const ContactPage = () => {
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
                <MessageSquare className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Contact Us</CardTitle>
              </div>
              <CardDescription>
                We're here to help! Get in touch with any questions or feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Support
                </h2>
                <p className="text-muted-foreground mb-4">
                  For general inquiries, technical support, or feedback about Invoice Generator, 
                  please contact us via email:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <a 
                    href="mailto:support@paingthu.com" 
                    className="text-primary hover:underline text-lg font-medium flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    support@paingthu.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to open your email client, or copy this address to your preferred email application.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Response Time
                </h2>
                <p className="text-muted-foreground">
                  We aim to respond to all inquiries within 24-48 hours during business days. 
                  For urgent technical issues affecting your access to the application, please clearly mark 
                  your email subject as "URGENT" and we'll prioritize your request.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  What to Include
                </h2>
                <p className="text-muted-foreground mb-3">
                  To help us assist you more effectively, please include the following in your message:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Your registered email address</strong> (if you have an account)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Detailed description</strong> of your question or issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Screenshots</strong> if reporting a technical problem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Browser and device information</strong> if experiencing display or functionality issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Steps to reproduce</strong> the issue (if applicable)</span>
                  </li>
                </ul>
              </section>

              <section className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Common Topics</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border rounded-lg p-3 space-y-1">
                    <h3 className="font-semibold text-sm">Account Issues</h3>
                    <p className="text-xs text-muted-foreground">Login problems, password resets, account deletion</p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <h3 className="font-semibold text-sm">Technical Support</h3>
                    <p className="text-xs text-muted-foreground">Bugs, errors, feature not working as expected</p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <h3 className="font-semibold text-sm">Feature Requests</h3>
                    <p className="text-xs text-muted-foreground">Suggestions for new features or improvements</p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <h3 className="font-semibold text-sm">Data & Privacy</h3>
                    <p className="text-xs text-muted-foreground">Questions about data handling and privacy</p>
                  </div>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900">
                  <strong>Note:</strong> Before contacting support, you may want to review our 
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/about")}
                    className="px-1 h-auto text-sm text-blue-700"
                  >
                    About
                  </Button>
                  page for application information or our 
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/policy")}
                    className="px-1 h-auto text-sm text-blue-700"
                  >
                    Privacy Policy
                  </Button>
                  for data-related questions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                For partnership opportunities, business collaborations, or media inquiries, 
                please email us at 
                <a 
                  href="mailto:support@paingthu.com" 
                  className="text-primary hover:underline ml-1"
                >
                  support@paingthu.com
                </a> with "Business Inquiry" in the subject line.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
