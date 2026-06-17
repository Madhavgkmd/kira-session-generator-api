const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");

const app = express();

// Cross-Origin പ്രശ്നങ്ങൾ ഒഴിവാക്കാൻ (Vercel-ൽ നിന്ന് റിക്വസ്റ്റ് വരുമ്പോൾ)
app.use(cors());
app.use(express.json());

// പഴയ റൂട്ട് അതുപോലെ തന്നെ നിലനിർത്തുന്നു
app.get("/", (req, res) => {
    res.send("KIRA SESSION GENERATOR ONLINE 🔥");
});

// പുതിയ പെയറിങ് എഞ്ചിൻ (ഇതാണ് ChatGPT തരാതിരുന്നത്!)
app.get("/pair", async (req, res) => {
    let phone = req.query.phone;
    
    if (!phone) return res.json({ error: "Please provide a phone number!" });
    
    // ഫോൺ നമ്പറിലെ അനാവശ്യ സ്പേസുകളും ചിഹ്നങ്ങളും ഒഴിവാക്കുന്നു
    phone = phone.replace(/[^0-9]/g, '');

    const sessionFolder = `./temp_sessions/session_${phone}_${Date.now()}`;
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        
        const sock = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Mac OS", "Chrome", "1.0.0"] 
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            const code = await sock.requestPairingCode(phone);
            // ഫ്രണ്ട്-എൻഡിലേക്ക് കോഡ് അയക്കുന്നു
            res.json({ code: code.match(/.{1,4}/g).join("-") }); 
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log(`✅ Session generated for ${phone}`);
                await delay(3000); 

                const credsData = fs.readFileSync(`${sessionFolder}/creds.json`);
                const sessionId = Buffer.from(credsData).toString('base64');

                const successMsg = `*✅ KIRA-X-MD SESSION GENERATED*\n\n*✨ SESSION ID:*\n${sessionId}\n\n_⚠️ Do not share this code with anyone!_`;
                
                // യൂസറിന് വാട്സാപ്പിൽ സെഷൻ ഐഡി മെസ്സേജ് ആയി അയക്കുന്നു
                await sock.sendMessage(sock.user.id, { text: successMsg });
                
                await delay(2000);
                
                // സിസ്റ്റം ക്ലീൻ അപ്പ്
                await sock.logout();
                await sock.ws.close();
                fs.removeSync(sessionFolder); 
                console.log(`🗑️ Cleanup done for ${phone}`);
            }

            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.connectionClosed) {
                    try { fs.removeSync(sessionFolder); } catch (e) {}
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error("Pairing Error:", err);
        try { fs.removeSync(sessionFolder); } catch (e) {}
        if (!res.headersSent) res.json({ error: "Service Unavailable. Try again later." });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});