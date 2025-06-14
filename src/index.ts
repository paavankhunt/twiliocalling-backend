import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import twilio from 'twilio';

config(); // Load .env variables

const app = express();
app.use(cors());

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

app.get('/ping', (req, res) => {
  res.send('Twilio Token Server is running. Use /token to get a token.');
});

app.get('/token', (req, res) => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID!;
  const twilioApiKey = process.env.TWILIO_API_KEY!;
  const twilioApiSecret = process.env.TWILIO_API_SECRET!;
  const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID!;

  const identity = 'receiver-user';

  const token = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    { ttl: 3600, identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  res.json({ token: token.toJwt(), identity });
});

app.post('/voice', express.urlencoded({ extended: false }), (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  // Get client identity from body or query, fallback to 'receiver-user'
  const client = req.body.To || req.query.To || 'receiver-user';

  // Optionally, add logic to check if 'client' is a phone number or client identity
  // For now, always dial as client
  twiml.dial().client(client);

  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Twilio token server running on http://localhost:${PORT}`);
});
