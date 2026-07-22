// COI Management Server - Handles COI storage, overlay, and email
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const PORT = 3003;

// COI storage directory
const COI_STORAGE_DIR = '/var/www/vanguard/coi-templates';

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads (memory storage for email attachments)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Create storage directory if it doesn't exist
async function ensureStorageDir() {
    try {
        await fs.mkdir(COI_STORAGE_DIR, { recursive: true });
        console.log('✅ COI storage directory ready:', COI_STORAGE_DIR);
    } catch (error) {
        console.error('Error creating storage directory:', error);
    }
}

// Initialize storage
ensureStorageDir();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'COI Management Server is running',
        storage_dir: COI_STORAGE_DIR
    });
});

// Save COI template (from CRM)
app.post('/api/coi/save-template', async (req, res) => {
    try {
        const { policy_number, pdf_base64, filename } = req.body;

        if (!policy_number || !pdf_base64) {
            return res.status(400).json({
                success: false,
                error: 'Missing policy_number or pdf_base64'
            });
        }

        // Save the PDF template
        const pdfBuffer = Buffer.from(pdf_base64, 'base64');
        const templatePath = path.join(COI_STORAGE_DIR, `${policy_number}_template.pdf`);

        await fs.writeFile(templatePath, pdfBuffer);

        console.log('✅ COI template saved for policy:', policy_number);
        console.log('   Path:', templatePath);
        console.log('   Size:', pdfBuffer.length, 'bytes');

        res.json({
            success: true,
            message: 'COI template saved successfully',
            policy_number: policy_number,
            path: templatePath
        });
    } catch (error) {
        console.error('Error saving COI template:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate COI with certificate holder overlay (from website)
app.post('/api/coi/generate', async (req, res) => {
    try {
        // Extract data from request
        const {
            policy_id,
            certificate_holder,
            recipient_email
        } = req.body;

        // Get token from Authorization header or body
        let token = req.body.token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        console.log('📋 Processing COI generation request');
        console.log('   Token:', token);
        console.log('   Policy ID:', policy_id);
        console.log('   Certificate Holder:', certificate_holder?.name);
        console.log('   Email to:', recipient_email);

        // Decode token if provided (format: base64(userId:policyNumber:123))
        let policy_number = null;
        if (token) {
            try {
                const decoded = Buffer.from(token, 'base64').toString('utf-8');
                const parts = decoded.split(':');
                if (parts.length >= 2) {
                    policy_number = parts[1]; // Second part is policy number
                }
                console.log('   Decoded policy number from token:', policy_number);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }

        // If no policy number from token, try to map from policy_id
        if (!policy_number && policy_id) {
            // Map common policy IDs to actual policy numbers
            const policyMap = {
                'policy-1': '864709702',  // Test policy mapping - has saved template
                // Remove other mappings until they have saved templates
            };

            if (policyMap[policy_id]) {
                policy_number = policyMap[policy_id];
                console.log('   Mapped policy_id to policy_number:', policy_number);
            } else {
                // Try to extract policy number from policy_id if it contains it
                // e.g., "policy-864709702" -> "864709702"
                const match = policy_id.match(/\d{6,}/);  // At least 6 digits for valid policy
                if (match) {
                    policy_number = match[0];
                    console.log('   Extracted policy number from policy_id:', policy_number);
                }
            }
        }

        // Return error if no policy number found
        if (!policy_number) {
            console.log('   No policy number found in token or request');
            return res.status(400).json({
                success: false,
                error: 'Invalid request. No policy number provided.'
            });
        }

        // Load the template
        const templatePath = path.join(COI_STORAGE_DIR, `${policy_number}_template.pdf`);

        // Check if template exists
        try {
            await fs.access(templatePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: `No COI saved to profile. Please call support.`
            });
        }

        const existingPdfBytes = await fs.readFile(templatePath);

        // Load PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Get page dimensions
        const { width, height } = firstPage.getSize();

        // Embed fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Add certificate holder overlay if provided
        if (certificate_holder) {
            // ACORD 25 standard position for certificate holder section
            // Typically in the lower left portion of the form
            const boxX = 50;
            const boxY = height - 470; // Adjusted for ACORD 25 layout
            const fontSize = 10;

            // Clear any existing placeholder text first by drawing white rectangle
            firstPage.drawRectangle({
                x: boxX - 5,
                y: boxY - 20,
                width: 300,
                height: 80,
                color: rgb(1, 1, 1), // White
                opacity: 1
            });

            // Draw "CERTIFICATE HOLDER" label if not already present
            firstPage.drawText('CERTIFICATE HOLDER', {
                x: boxX,
                y: boxY + 65,
                size: 11,
                font: helveticaBold,
                color: rgb(0, 0, 0),
            });

            // Draw certificate holder name
            if (certificate_holder.name) {
                firstPage.drawText(certificate_holder.name, {
                    x: boxX,
                    y: boxY + 45,
                    size: fontSize,
                    font: helveticaBold,
                    color: rgb(0, 0, 0),
                });
            }

            // Draw address line 1
            if (certificate_holder.address_line1) {
                firstPage.drawText(certificate_holder.address_line1, {
                    x: boxX,
                    y: boxY + 30,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }

            // Draw address line 2 if provided
            if (certificate_holder.address_line2) {
                firstPage.drawText(certificate_holder.address_line2, {
                    x: boxX,
                    y: boxY + 15,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }

            // Draw city, state, zip
            const cityStateZip = [
                certificate_holder.city,
                certificate_holder.state,
                certificate_holder.zip
            ].filter(Boolean).join(', ');

            if (cityStateZip) {
                firstPage.drawText(cityStateZip, {
                    x: boxX,
                    y: boxY + (certificate_holder.address_line2 ? 0 : 15),
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Add generation timestamp at bottom
        const timestamp = new Date().toISOString();
        firstPage.drawText(`Generated: ${timestamp}`, {
            x: width - 200,
            y: 15,
            size: 7,
            font: helveticaFont,
            color: rgb(0.6, 0.6, 0.6),
        });

        // Save the modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

        // Save a copy of the generated COI
        const generatedPath = path.join(COI_STORAGE_DIR, `${policy_number}_generated_${Date.now()}.pdf`);
        await fs.writeFile(generatedPath, modifiedPdfBytes);

        // Send email if requested
        let emailResult = null;
        if (recipient_email) {
            try {
                emailResult = await sendCOIEmail(
                    recipient_email,
                    policy_number,
                    certificate_holder?.name,
                    modifiedPdfBytes
                );
                console.log('✅ Email sent successfully to:', recipient_email);
            } catch (emailError) {
                console.error('❌ Email failed:', emailError.message);
                // Don't fail the whole request if email fails
            }
        }

        console.log('✅ COI generated successfully');
        console.log('   Policy:', policy_number);
        console.log('   Certificate Holder:', certificate_holder?.name);
        console.log('   Saved to:', generatedPath);

        res.json({
            success: true,
            message: 'COI generated successfully',
            policy_number: policy_number,
            certificate_holder: certificate_holder?.name,
            email_sent: !!emailResult,
            email_recipient: recipient_email,
            pdf_base64: modifiedPdfBase64,
            pdf_size: modifiedPdfBytes.length
        });

    } catch (error) {
        console.error('Error generating COI:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process COI request (from website) - legacy endpoint
app.post('/api/coi/process-request', async (req, res) => {
    try {
        const {
            policy_number,
            certificate_holder_name,
            certificate_holder_address,
            certificate_holder_city,
            certificate_holder_state,
            certificate_holder_zip,
            recipient_email,
            additional_info
        } = req.body;

        console.log('📋 Processing COI request for policy:', policy_number);
        console.log('   Certificate Holder:', certificate_holder_name);
        console.log('   Email to:', recipient_email);

        // Load the template
        const templatePath = path.join(COI_STORAGE_DIR, `${policy_number}_template.pdf`);

        // Check if template exists
        try {
            await fs.access(templatePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: `No COI saved to profile. Please call support.`
            });
        }

        const existingPdfBytes = await fs.readFile(templatePath);

        // Load PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Get page dimensions
        const { width, height } = firstPage.getSize();

        // Embed font
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Add certificate holder overlay
        // Position for certificate holder box (adjust based on ACORD 25 layout)
        const boxX = 50;
        const boxY = 200; // From bottom of page
        const fontSize = 10;

        // Draw certificate holder name
        firstPage.drawText(certificate_holder_name || '', {
            x: boxX,
            y: boxY + 60,
            size: fontSize,
            font: helveticaBold,
            color: rgb(0, 0, 0),
        });

        // Draw address
        if (certificate_holder_address) {
            firstPage.drawText(certificate_holder_address, {
                x: boxX,
                y: boxY + 45,
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }

        // Draw city, state, zip
        if (certificate_holder_city || certificate_holder_state || certificate_holder_zip) {
            const cityStateZip = `${certificate_holder_city || ''}, ${certificate_holder_state || ''} ${certificate_holder_zip || ''}`.trim();
            firstPage.drawText(cityStateZip, {
                x: boxX,
                y: boxY + 30,
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }

        // Add timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        firstPage.drawText(`Generated: ${timestamp}`, {
            x: width - 150,
            y: 20,
            size: 8,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Save the modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

        // Send email if requested
        if (recipient_email) {
            await sendCOIEmail(
                recipient_email,
                policy_number,
                certificate_holder_name,
                modifiedPdfBytes
            );
        }

        console.log('✅ COI processed successfully');

        res.json({
            success: true,
            message: 'COI processed and sent successfully',
            policy_number: policy_number,
            certificate_holder: certificate_holder_name,
            email_sent_to: recipient_email,
            pdf_base64: modifiedPdfBase64
        });

    } catch (error) {
        console.error('Error processing COI request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get saved COI template (as JSON)
app.get('/api/coi/get-template/:policy_number', async (req, res) => {
    try {
        const { policy_number } = req.params;
        const templatePath = path.join(COI_STORAGE_DIR, `${policy_number}_template.pdf`);

        const pdfBuffer = await fs.readFile(templatePath);
        const base64 = pdfBuffer.toString('base64');

        res.json({
            success: true,
            policy_number: policy_number,
            pdf_base64: base64,
            size: pdfBuffer.length
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Template not found'
        });
    }
});

// View saved COI template (as PDF)
app.get('/api/coi/view-template/:policy_number', async (req, res) => {
    try {
        const { policy_number } = req.params;
        const templatePath = path.join(COI_STORAGE_DIR, `${policy_number}_template.pdf`);

        console.log(`📄 Serving COI template for policy: ${policy_number}`);

        // Check if file exists
        try {
            await fs.access(templatePath);
        } catch {
            return res.status(404).json({
                error: `No saved COI template for policy ${policy_number}`
            });
        }

        const pdfBuffer = await fs.readFile(templatePath);

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${policy_number}_template.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error serving template:', error);
        res.status(500).json({ error: error.message });
    }
});

// List all saved COI templates
app.get('/api/coi/list-templates', async (req, res) => {
    try {
        const files = await fs.readdir(COI_STORAGE_DIR);
        const templates = files
            .filter(f => f.endsWith('_template.pdf'))
            .map(f => f.replace('_template.pdf', ''));

        res.json({
            success: true,
            templates: templates,
            count: templates.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Email sending function
async function sendCOIEmail(recipientEmail, policyNumber, certificateHolder, pdfBytes) {
    // Use GoDaddy/Outlook email configuration (working)
    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
            user: 'contact@vigagency.com',
            pass: process.env.GODADDY_VIG_PASSWORD || ''
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: 'VIG Insurance <contact@vigagency.com>',
        to: recipientEmail,
        subject: `Certificate of Insurance - Policy ${policyNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Certificate of Insurance</h2>
                <p>Dear ${certificateHolder || 'Certificate Holder'},</p>
                <p>Please find attached the Certificate of Insurance (ACORD 25) for policy number <strong>${policyNumber}</strong>.</p>
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
                    Vanguard Insurance Group<br>
                    Phone: (555) 123-4567<br>
                    Email: contact@vigagency.com
                </p>
            </div>
        `,
        attachments: [{
            filename: `COI_${policyNumber}_${certificateHolder?.replace(/\s+/g, '_') || 'Certificate'}.pdf`,
            content: pdfBytes
        }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✉️ Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
}

// Send general documentation email
app.post('/api/coi/send-request', (req, res, next) => {
    upload.array('attachment', 10)(req, res, (err) => {
        if (err) {
            console.log('🚨 COI Server multer error:', err.message);
            return res.status(400).json({
                success: false,
                error: 'File upload error: ' + err.message
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('🚨🚨🚨 COI MANAGEMENT SERVER HANDLING /api/coi/send-request 🚨🚨🚨');
        console.log('📧 Processing documentation email request');
        console.log('   req.body:', req.body);
        console.log('   req.files:', req.files?.length || 0, 'files');
        console.log('   req.headers user-agent:', req.headers['user-agent']);
        console.log('   Full request details:', {
            method: req.method,
            url: req.url,
            contentType: req.headers['content-type']
        });

        const { to, subject, message, leadId } = req.body;

        console.log('   To:', to);
        console.log('   Subject:', subject);
        console.log('   Lead ID:', leadId);

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient email is required'
            });
        }

        if (!subject) {
            return res.status(400).json({
                success: false,
                error: 'Email subject is required'
            });
        }

        // Create email transporter (same config as COI emails)
        const transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: 'contact@vigagency.com',
                pass: process.env.GODADDY_VIG_PASSWORD || ''
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Prepare attachments from uploaded files
        const attachments = [];

        // Process uploaded files from multer
        if (req.files && req.files.length > 0) {
            console.log(`📎 Processing ${req.files.length} uploaded files`);

            req.files.forEach((file, index) => {
                attachments.push({
                    filename: file.originalname || `document_${index + 1}`,
                    content: file.buffer,
                    contentType: file.mimetype
                });

                console.log(`📎 Added attachment: ${file.originalname} (${file.buffer.length} bytes, ${file.mimetype})`);
            });
        }

        // Prepare email options
        const mailOptions = {
            from: 'contact@vigagency.com',
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Vanguard Insurance Agency</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Documentation Request</p>
                    </div>

                    <div style="padding: 30px; background: #f9f9f9;">
                        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="color: #333; line-height: 1.6;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>

                            ${attachments.length > 0 ? `
                            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Attached Documents:</h3>
                                <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                                    ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px;">
                        <p style="margin: 0;">Best regards,<br><strong>Vanguard Insurance Agency</strong></p>
                        <p style="margin: 10px 0 0 0; opacity: 0.8;">contact@vigagency.com</p>
                    </div>
                </div>
            `,
            attachments: attachments
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Documentation email sent successfully:', info.messageId);

        res.json({
            success: true,
            messageId: info.messageId,
            attachmentCount: attachments.length
        });

    } catch (error) {
        console.error('❌ Documentation email error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send documentation email',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 COI Management Server running on port ${PORT}`);
    console.log(`📁 Storing COI templates in: ${COI_STORAGE_DIR}`);
    console.log(`✅ Ready to handle COI requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down COI Management Server...');
    process.exit(0);
});