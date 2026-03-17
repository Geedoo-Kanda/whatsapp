import express from "express";
import cors from "cors";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

const app = express();

// Autoriser CORS pour Laravel
app.use(cors({
  origin: "http://localhost:8000",
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "5mb" }));

// Client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions", "--disable-gpu"],
  },
});

// QR code pour première connexion
client.on("qr", (qr) => {
  console.log("📲 Scanner ce QR code avec WhatsApp :");
  qrcode.generate(qr, { small: true });
});

// Client prêt
client.on("ready", async () => {
  console.log("✅ WhatsApp connecté, attente 10s pour stabilité...");
  await new Promise(r => setTimeout(r, 10000));
  console.log("✅ WhatsApp prêt pour envoyer des messages");
});

client.initialize();

// Endpoint pour envoyer message texte + PDF
app.post("/send-invoice", async (req, res) => {
  try {
    console.log("📩 Requête reçue:", req.body); // debug
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: "phone et message requis" });
    }

    const chatId = phone.endsWith("@c.us") ? phone : phone + "@c.us";

    console.log(`📩 Envoi du message à ${chatId} : ${message}`);
    // Envoyer uniquement le texte (message + lien)
    await client.sendMessage(chatId, message);

    res.json({ success: true, message: "Message envoyé ✅" });

  } catch (error) {
    console.error("Erreur en envoyant le message :", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lancement serveur
app.listen(3000, () => {
  console.log("🚀 WhatsApp API running on port 3000");
});