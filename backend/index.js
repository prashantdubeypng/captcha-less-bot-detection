import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
// ----------------------
// Google Sheets Auth
// ----------------------
const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// ----------------------
// Health Check
// ----------------------
app.get("/", (req, res) => {
    res.send("Backend is running");
});

// ----------------------
// Collect Endpoint
// ----------------------
app.post("/collect", async (req, res) => {
    try {
        const data = req.body;

        // Basic validation
        if (!data.sessionId) {
            return res.status(400).json({ error: "Invalid payload" });
        }

        const row = [
            data.sessionId,
            data.firstActionDelay ?? "",
            data.mouseMoves?.length ?? 0,
            data.scrollEvents?.length ?? 0,
            data.keyEvents?.length ?? 0,
            data.clickEvents?.length ?? 0,
            data.networkEvents?.length ?? 0,
            data.sessionDuration ?? ""
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: "Sheet1!A1",
            valueInputOption: "RAW",
            requestBody: {
                values: [row]
            }
        });

        res.status(200).json({ status: "ok" });
    } catch (err) {
        console.error("Error writing to sheet:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
