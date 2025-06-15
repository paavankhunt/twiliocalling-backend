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

  // Get identity from query param, fallback to 'receiver-user'
  const identity = (req.query.identity as string) || 'receiver-user';
  console.log('🚀 ~ app.get ~ identity:', identity);

  const token = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    { ttl: 3600, identity }
  );
  console.log('🚀 ~ app.get ~ token:', token);

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  console.log('🚀 ~ app.get ~ token.toJwt():', token.toJwt());
  res.json({ token: token.toJwt(), identity });
});

app.post('/voice', express.urlencoded({ extended: false }), (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  let to = req.body.To || req.query.To || 'receiver-user';
  to = to.trim(); // Remove leading/trailing whitespace
  console.log('🚀 ~ app.post ~ to:', to);

  // If 'to' starts with + and is all digits, treat as phone number
  if (/^\+\d{10,}$/.test(to)) {
    console.log('🚀 ~ app.post ~ to:', process.env.TWILIO_CALLER_ID);
    twiml.dial({ callerId: process.env.TWILIO_CALLER_ID }).number(to);
  } else {
    twiml.dial().client(to);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Twilio token server running on http://localhost:${PORT}`);
});
