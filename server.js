const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Resend Email API',
    timestamp: new Date().toISOString()
  });
});

// Contact endpoint - MAIN FUNCTIONALITY
app.post('/contact', async (req, res) => {
  console.log('📨 Contact form submission received:', {
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    timestamp: new Date().toISOString()
  });

  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, subject, message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    console.log('📤 Sending email via Resend...');

    // Send email using Resend
    const { data, error } = await resend.emails.send({
    from: 'John Portfolio <notifications@resend.dev>',
      to: [process.env.YOUR_EMAIL],
      reply_to: email,
      subject: `PORTFOLIO CONTACT: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content { 
                    background: #f8f9fa; 
                    padding: 25px; 
                    border-radius: 0 0 10px 10px;
                }
                .field { 
                    background: white; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 5px; 
                    border-left: 4px solid #667eea;
                }
                .message { 
                    background: white; 
                    padding: 20px; 
                    margin: 15px 0; 
                    border-radius: 5px; 
                    border: 1px solid #e9ecef;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 20px; 
                    padding-top: 20px; 
                    border-top: 1px solid #dee2e6; 
                    color: #6c757d; 
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚀 New Portfolio Contact</h1>
                <p>You have a new message from your portfolio website</p>
            </div>
            
            <div class="content">
                <div class="field">
                    <strong>👤 Name:</strong> ${name}
                </div>
                
                <div class="field">
                    <strong>📧 Email:</strong> ${email}
                </div>
                
                <div class="field">
                    <strong>📝 Subject:</strong> ${subject}
                </div>
                
                <div class="message">
                    <strong>💬 Message:</strong><br><br>
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="footer">
                <p>This message was sent from your portfolio contact form on ${new Date().toLocaleString()}</p>
                <p>💡 You can reply directly to this email to respond to ${name}</p>
            </div>
        </body>
        </html>
      `,
      text: `
New Portfolio Contact Form Submission:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from your portfolio contact form on ${new Date().toLocaleString()}
      `
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Email service error. Please try again later.'
      });
    }

    console.log('✅ Email sent successfully via Resend. ID:', data?.id);
    
    res.status(200).json({
      success: true,
      message: 'Message sent successfully! I will get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

// Test endpoint to verify Resend is working
app.get('/test-email', async (req, res) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: [process.env.YOUR_EMAIL],
      subject: '✅ Portfolio API Test - Resend is Working!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #22c55e;">🎉 Success! Your Resend setup is working!</h2>
          <p>Your portfolio contact form is now properly configured with Resend.</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p>You will now receive emails when visitors submit your contact form.</p>
        </div>
      `
    });

    if (error) {
      return res.json({ 
        success: false, 
        message: 'Test failed: ' + error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Test email sent successfully! Check your inbox.',
      emailId: data.id
    });

  } catch (error) {
    res.json({ 
      success: false, 
      message: 'Test error: ' + error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Portfolio Contact API is running!',
    service: 'Resend Email API',
    endpoints: {
      contact: 'POST /contact',
      health: 'GET /health',
      test: 'GET /test-email'
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Contact endpoint: http://localhost:${PORT}/contact`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test email: http://localhost:${PORT}/test-email`);
  console.log(`💌 Using Resend for email delivery`);
});