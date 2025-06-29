import { Router } from 'express';
import axios from 'axios';

const router = Router();
const GEMINI_API_KEY = 'AIzaSyDKtCYV6oVavi8e8HzeB8-f9cdSpCukYRg';

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    res.json({ text });
  } catch (err: any) {
    // Log the actual error for debugging
    console.error('Gemini API error:', err?.response?.data || err.message || err);
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message || 'Gemini API error' });
  }
});

export default router;
