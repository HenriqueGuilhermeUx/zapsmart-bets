import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://zapsmart.com.br', 'http://localhost:5173'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// Healthcheck
app.get('/', (req, res) => {
  res.type('text').send('ZapSmart Bets online - use POST /bets/chat');
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const reply = (response, suggestions = []) => ({ response, suggestions });

app.post('/bets/chat', async (req, res) => {
  const { message } = req.body || {};
  try {
    // IA simples (depois pluga odds/parceiro)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um analista de apostas responsável: explique odds, prob. implícita e gestão de banca.' },
        { role: 'user', content: `Pergunta do usuário: ${message || ''}` }
      ],
      temperature: 0.5
    });
    const text = completion.choices?.[0]?.message?.content || 'Sem resposta.';
    const suggestions = ['Odds do jogo X', 'Probabilidade implícita', 'Value bet', 'Gestão de banca', 'Ambas marcam?'];
    return res.json(reply(text + '<br><small>Jogue com responsabilidade.</small>', suggestions));
  } catch (e) {
    console.error(e);
    return res.json(reply('🤖 Erro em Bets. Tente novamente.', ['Value bet', 'Gestão de banca']));
  }
});

const methodNotAllowed = (req, res) => res.status(405).send('Method Not Allowed. Use POST.');
app.get('/bets/chat', methodNotAllowed);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ZapSmart Bets rodando na porta ${port}`));
