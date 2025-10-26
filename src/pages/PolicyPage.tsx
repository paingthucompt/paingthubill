import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const PolicyPage = () => {
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            </div>
            <CardDescription>
              Last Updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-amber-900 mb-2">Legal Disclaimer:</p>
              <p className="text-amber-800">
                This privacy policy is automatically generated and serves as a template. 
                It should be reviewed and customized by a qualified legal professional to ensure 
                full compliance with Google AdSense terms, GDPR, CCPA, and other applicable laws 
                in your jurisdiction.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information that you provide directly to us when using the Invoice Generator application:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Account Information:</strong> Email address and password when you register for an account</li>
                <li><strong>Client Data:</strong> Information you enter about your clients, including names, commission rates, currencies, and bank account details</li>
                <li><strong>Transaction Records:</strong> Financial transaction data you input, including amounts, exchange rates, and dates</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>To provide and maintain the Invoice Generator application functionality</li>
                <li>To authenticate your account and ensure secure access</li>
                <li>To store and manage your client and transaction data</li>
                <li>To generate invoices and calculate payouts based on your inputs</li>
                <li>To improve our services and user experience</li>
                <li>To communicate with you about service updates or issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground mb-2">
                Our website uses cookies and similar tracking technologies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Essential Cookies:</strong> Required for authentication and application functionality</li>
                <li><strong>Local Storage:</strong> Used to maintain your session and application state</li>
                <li><strong>Third-Party Cookies:</strong> We may use Google AdSense for advertising, which uses cookies to serve personalized ads based on your browsing activity. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet.</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                You can manage your cookie preferences through your browser settings. However, disabling essential cookies may affect the functionality of the application. For more information about Google's advertising cookies, visit <a href="https://policies.google.com/technologies/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google's Advertising Policies</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Third-Party Data Sharing</h2>
              <p className="text-muted-foreground mb-2">
                We may share your information with third parties in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Google AdSense:</strong> We use Google AdSense to display advertisements. Google may collect and use data about your visits to this and other websites to provide personalized ads. This may include the use of cookies and similar technologies.</li>
                <li><strong>Service Providers:</strong> We use a self-hosted backend (Express + PostgreSQL) for authentication and data storage. Your data is stored on the server you or your administrator configures and is protected according to the security practices described below.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Secure authentication with encrypted password storage</li>
                <li>Server-enforced per-user data isolation: the API validates user identity and scopes queries so users can only access their own clients, transactions, and invoices</li>
                <li>HTTPS encryption for data transmission</li>
                <li>Regular security updates and monitoring</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-2">
                Depending on your location, you may have certain rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Access:</strong> You can access your personal information at any time through your account dashboard</li>
                <li><strong>Correction:</strong> You can update or correct your information directly in the application</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us</li>
                <li><strong>Data Portability:</strong> You can export your data in PDF or JPEG format through the invoice generation feature</li>
                <li><strong>Opt-Out of Personalized Ads:</strong> You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you services. 
                If you wish to delete your account or request that we no longer use your information, please contact us. 
                We will retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for users under the age of 18. We do not knowingly collect personal information from children. 
                If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction 
                where data protection laws may differ. By using our service, you consent to the transfer of your information to these locations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
                and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us through the 
                <Button 
                  variant="link" 
                  onClick={() => navigate("/contact")}
                  className="px-1 h-auto"
                >
                  Contact Us
                </Button>
                page.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolicyPage;
