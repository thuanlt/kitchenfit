```javascript src/test-model-app.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Endpoint test model
app.post('/test-model', async (req, res) => {
  const { modelName, input } = req.body;

  try {
    let result;
    
    if (modelName === 'fpt-model') {
      const response = await fetch('https://mkp-api.fptcloud.jp/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FPT_API_KEY}`
        },
        body: JSON.stringify({
          model: 'GLM-5.1',
          messages: [{ role: 'user', content: input }],
          temperature: 1,
          max_tokens: 1024,
          top_p: 1,
          top_k: 40,
          presence_penalty: 0,
          frequency_penalty: 0,
          stream: true
        })
      });

      // Xử lý stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      result = { choices: [{ text: accumulated }] };
    }

    res.json({
      status: 'success',
      model: modelName,
      input: input,
      output: result.choices[0].text.trim()
    });

  } catch (error) {
    console.error(`Error calling ${modelName}:`, error);
    res.status(500).json({
      status: 'error',
      model: modelName,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Model tester running at http://localhost:${port}`);
  console.log('Supported models: fpt-model');
});
```
