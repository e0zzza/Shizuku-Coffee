import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  "https://e0zzza.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://localhost:5173"
];

app.use(cors({ origin(origin, callback) { if (!origin) return callback(null, true); if (ALLOWED_ORIGINS.includes(origin)) { return callback(null, true); } return callback(new Error("CORS not allowed")); } }));

app.use(express.json());

const giftCards = new Map();

function generateGiftCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GC-';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

app.post('/api/giftcard/generate', (req, res) => {
  const { value, purchaserEmail, recipientEmail, message } = req.body;

  if (!value || value < 100) {
    return res.status(400).json({ success: false, message: 'Minimum value is ¥100' });
  }

  const code = generateGiftCode();
  const giftCard = {
    code,
    value: Number(value),
    purchaserEmail: purchaserEmail || '',
    recipientEmail: recipientEmail || '',
    message: message || '',
    redeemedAt: null,
    redeemedBy: null,
    used: false
  };

  giftCards.set(code, giftCard);

  res.json({
    success: true,
    code,
    value,
    message: 'Gift card created successfully'
  });
});

app.post('/api/giftcard/redeem', (req, res) => {
  const { code, email } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Gift card code required' });
  }

  const normalizedCode = code.toUpperCase().replace(/ /g, '-');
  const giftCard = giftCards.get(normalizedCode);

  if (!giftCard) {
    return res.status(404).json({ success: false, message: 'Invalid gift card code' });
  }

  if (giftCard.used) {
    return res.status(400).json({ success: false, message: 'Gift card already used' });
  }

  giftCard.used = true;
  giftCard.redeemedAt = Date.now();
  giftCard.redeemedBy = email || '';
  giftCards.set(normalizedCode, giftCard);

  res.json({
    success: true,
    value: giftCard.value,
    message: 'Gift card redeemed successfully'
  });
});

app.get('/api/giftcard/check/:code', (req, res) => {
  const { code } = req.params;
  const normalizedCode = code.toUpperCase().replace(/ /g, '-');
  const giftCard = giftCards.get(normalizedCode);

  if (!giftCard) {
    return res.json({ valid: false, message: 'Invalid gift card code' });
  }

  if (giftCard.used) {
    return res.json({ valid: false, message: 'Gift card already used' });
  }

  res.json({
    valid: true,
    value: giftCard.value
  });
});

app.post('/api/giftcard/send', (req, res) => {
  const { code, recipientEmail, message } = req.body;

  if (!code || !recipientEmail) {
    return res.status(400).json({ success: false, message: 'Code and recipient email required' });
  }

  const normalizedCode = code.toUpperCase().replace(/ /g, '-');
  const giftCard = giftCards.get(normalizedCode);

  if (!giftCard) {
    return res.status(404).json({ success: false, message: 'Invalid gift card code' });
  }

  if (giftCard.used) {
    return res.status(400).json({ success: false, message: 'Gift card already used' });
  }
  giftCard.recipientEmail = recipientEmail;
  giftCard.message = message || '';
  giftCard.sentAt = Date.now();

  giftCards.set(normalizedCode, giftCard);

  res.json({
    success: true,
    message: 'Gift card sent successfully',
    recipientEmail
  });
});

app.post('/api/giftcard/send-stored', (req, res) => {
  const { code, recipientEmail, message, feePaid } = req.body;

  if (!code || !recipientEmail) {
    return res.status(400).json({ success: false, message: 'Code and recipient email required' });
  }

  if (!feePaid) {
    return res.status(400).json({ success: false, message: 'Fee not paid' });
  }

  const normalizedCode = code.toUpperCase().replace(/ /g, '-');
  const giftCard = giftCards.get(normalizedCode);

  if (!giftCard) {
    return res.status(404).json({ success: false, message: 'Invalid gift card code' });
  }

  if (giftCard.used) {
    return res.status(400).json({ success: false, message: 'Gift card already used' });
  }

  if (!giftCard.purchaserEmail) {
    return res.status(400).json({ success: false, message: 'Gift card not found in inventory' });
  }

  giftCard.recipientEmail = recipientEmail;
  giftCard.message = message || '';
  giftCard.resentAt = Date.now();

  giftCards.set(normalizedCode, giftCard);

  res.json({
    success: true,
    message: 'Gift card sent successfully',
    recipientEmail
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Shizuku Coffee Backend"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
