const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const sgMail = require('@sendgrid/mail');
const { buildTicket } = require('./ticket');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// Tiers
const TIERS = {
  GA: { name: 'General Admission', price: 3000, currency: 'JMD', image: 'img/ticket-ga.jpg' },
  VIP: { name: 'VIP', price: 6000, currency: 'JMD', image: 'img/ticket-vip.jpg' }
};

// Orders storage
const ORDERS_FILE = '/mnt/wgma-tickets/orders.json';
let orders = {};

// Load orders
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Orders file not found, starting fresh');
    orders = {};
  }
}

function saveOrders() {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (e) {
    console.error('Error saving orders:', e.message);
  }
}

loadOrders();

// XSS protection
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Send email with ticket
async function mailTicket(toEmail, orderData, ticketPath) {
  try {
    const ticketBuffer = fs.readFileSync(ticketPath);
    const base64Ticket = ticketBuffer.toString('base64');

    const msg = {
      to: toEmail,
      from: 'kingdomain.ministries@gmail.com',
      subject: `Your WGMA 2026 Ticket - Order ${orderData.orderId}`,
      html: `
        <p>Hello ${esc(orderData.name)},</p>
        <p>Thank you for your purchase! Your ticket is attached below.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: ${esc(orderData.orderId)}</li>
          <li>Tier: ${esc(orderData.tier)}</li>
          <li>Amount: ${esc(orderData.amount)} JMD</li>
          <li>Email: ${esc(orderData.email)}</li>
        </ul>
        <p>Please save your ticket. You'll need the QR code at the event.</p>
        <p>See you at WGMA 2026!</p>
      `,
      text: `Your WGMA 2026 ticket is attached. Order ID: ${orderData.orderId}`,
      attachments: [
        {
          content: base64Ticket,
          filename: `WGMA-2026-${orderData.orderId}.jpg`,
          type: 'image/jpeg',
          disposition: 'attachment'
        }
      ]
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error('SendGrid email error:', error.message);
    throw error;
  }
}

// Generate unique order ID
function generateOrderId() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// POST /api/checkout - Initiate payment
app.post('/api/checkout', async (req, res) => {
  try {
    const { tier, name, email, phone, paymentMethod } = req.body;

    if (!TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const orderId = generateOrderId();
    const amount = TIERS[tier].price;

    // Store order with pending status
    orders[orderId] = {
      orderId,
      tier,
      name,
      email,
      phone,
      amount,
      currency: 'JMD',
      status: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString()
    };
    saveOrders();

    if (paymentMethod === 'handypay') {
      // HandyPay card payment
      try {
        const response = await axios.post(
          'https://api.handypay.me/v1/transactions',
          {
            amount,
            currency: 'JMD',
            externalId: orderId,
            description: `WGMA 2026 ${tier} Ticket`,
            metadata: {
              orderId,
              tier,
              name,
              email
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.HANDYPAY_API_KEY}`
            }
          }
        );

        return res.json({
          status: 'success',
          orderId,
          redirectUrl: response.data.paymentUrl || response.data.checkoutUrl
        });
      } catch (error) {
        console.error('HandyPay error:', error.response?.data || error.message);
        orders[orderId].status = 'failed';
        saveOrders();
        return res.status(400).json({
          error: 'Payment initiation failed',
          details: error.response?.data?.message || error.message
        });
      }
    } else if (paymentMethod === 'lynk') {
      // Lynk - return order ID for manual confirmation
      return res.json({
        status: 'pending_confirmation',
        orderId,
        amount,
        message: 'Please complete payment via Lynk and return with your order ID'
      });
    }
  } catch (error) {
    console.error('Checkout error:', error.message);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// POST /webhook/handypay - Confirm payment
app.post('/webhook/handypay', async (req, res) => {
  try {
    const signature = req.headers['x-handypay-signature'];
    const body = JSON.stringify(req.body);

    // Verify signature
    const hash = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { externalId, status, amount } = req.body;
    const order = orders[externalId];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'completed') {
      order.status = 'paid';
      order.paidAt = new Date().toISOString();
      saveOrders();

      // Generate and send ticket
      try {
        const ticketPath = path.join(__dirname, 'tickets', `${externalId}.jpg`);
        await buildTicket(order, ticketPath);
        await mailTicket(order.email, order, ticketPath);
      } catch (emailError) {
        console.error('Organiser email failed:', externalId, emailError.message);
        // Don't fail the payment if email fails
      }

      res.json({ status: 'success' });
    } else {
      order.status = 'failed';
      saveOrders();
      res.json({ status: 'failed' });
    }
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/admin/confirm - Manual Lynk confirmation
app.post('/api/admin/confirm', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId } = req.body;
  const order = orders[orderId];

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status === 'paid') {
    return res.status(400).json({ error: 'Order already paid' });
  }

  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  saveOrders();

  // Generate and send ticket
  (async () => {
    try {
      const ticketPath = path.join(__dirname, 'tickets', `${orderId}.jpg`);
      await buildTicket(order, ticketPath);
      await mailTicket(order.email, order, ticketPath);
    } catch (emailError) {
      console.error('Organiser email failed:', orderId, emailError.message);
    }
  })();

  res.json({ status: 'success', message: 'Order confirmed' });
});

// GET /api/admin/orders - Get orders summary
app.get('/api/admin/orders', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const summary = {
    total: Object.keys(orders).length,
    paid: Object.values(orders).filter(o => o.status === 'paid').length,
    pending: Object.values(orders).filter(o => o.status === 'pending').length,
    failed: Object.values(orders).filter(o => o.status === 'failed').length,
    byTier: {
      GA: Object.values(orders).filter(o => o.tier === 'GA' && o.status === 'paid').length,
      VIP: Object.values(orders).filter(o => o.tier === 'VIP' && o.status === 'paid').length
    },
    revenue: Object.values(orders)
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + o.amount, 0),
    orders: orders
  };

  res.json(summary);
});

// GET / - Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ensure tickets directory exists
const ticketsDir = path.join(__dirname, 'tickets');
if (!fs.existsSync(ticketsDir)) {
  fs.mkdirSync(ticketsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
