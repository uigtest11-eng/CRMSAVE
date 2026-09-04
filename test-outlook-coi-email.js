const nodemailer = require('nodemailer');
const fs = require('fs').promises;

async function testOutlookCOIEmail() {
    console.log('📧 Testing Outlook/GoDaddy Email for COI Sending');
    console.log('='.repeat(50));

    try {
        // Load a sample COI PDF
        const pdfPath = '/var/www/vanguard/coi-templates/864709702_template.pdf';
        const pdfBytes = await fs.readFile(pdfPath);
        console.log('✅ Loaded PDF template:', pdfPath);
        console.log('   Size:', pdfBytes.length, 'bytes');

        // Configure Outlook/GoDaddy email (secureserver.net is GoDaddy's email service)
        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net', // GoDaddy SMTP
            port: 465,
            secure: true, // Use SSL
            auth: {
                user: 'contact@vigagency.com',
                pass: process.env.GODADDY_VIG_PASSWORD || ''
            },
            tls: {
                rejectUnauthorized: false // Accept self-signed certificates
            }
        });

        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified!');

        // Prepare email
        const mailOptions = {
            from: 'VIG Insurance <contact@vigagency.com>',
            to: 'grant.corp2006@gmail.com',
            subject: 'Certificate of Insurance - Policy 864709702',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Certificate of Insurance</h2>
                    <p>Dear ARB Transport LLC,</p>
                    <p>Please find attached the Certificate of Insurance (ACORD 25) for policy number <strong>864709702</strong>.</p>
                    <p>This certificate provides evidence of liability insurance as requested.</p>
                    <hr style="margin: 20px 0;">
                    <p><strong>Important Information:</strong></p>
                    <ul>
                        <li>This certificate is issued as a matter of information only</li>
                        <li>This certificate does not amend, extend or alter the coverage afforded by the policies</li>
                        <li>Please review all information carefully</li>
                    </ul>
                    <p>If you have any questions, please contact us.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        VIG Insurance Agency<br>
                        Professional Liability Coverage<br>
                        Generated: ${new Date().toISOString()}
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: 'COI_864709702.pdf',
                    content: pdfBytes,
                    contentType: 'application/pdf'
                }
            ]
        };

        console.log('📤 Sending email...');
        console.log('   From:', mailOptions.from);
        console.log('   To:', mailOptions.to);
        console.log('   Attachment:', 'COI_864709702.pdf');

        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Accepted:', info.accepted);
        console.log('   Response:', info.response);

        return true;

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   Authentication failed - check credentials');
        }
        if (error.code === 'ECONNECTION') {
            console.error('   Connection failed - check host and port');
        }
        console.error('   Full error:', error);
        return false;
    }
}

testOutlookCOIEmail().then(success => {
    if (success) {
        console.log('\n🎯 Email is working! Ready to send COIs.');
    } else {
        console.log('\n⚠️ Email needs configuration.');
    }
});