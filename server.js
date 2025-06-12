const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files (public + admin panel)
app.use(express.static('public'));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ✅ Data file path
const filePath = path.join(__dirname, 'data', 'laptops.json');

// ✅ Read from file
async function readData() {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // If file doesn't exist, return empty structure
      return { blog: [], news: [], event: [], job: [] };
    } else {
      console.error('❌ Read error:', err);
      throw err;
    }
  }
}

// ✅ Write to file
async function writeData(data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Write error:', err);
    throw err;
  }
}

// ✅ GET all items by type
app.get('/api/:type', async (req, res) => {
  const type = req.params.type;
  const data = await readData();
  if (!data[type]) return res.status(404).send('Invalid type');
  res.json(data[type]);
});

// ✅ POST new item
app.post('/api/:type', async (req, res) => {
  const type = req.params.type;
  const newItem = req.body;

  if (!newItem || !newItem.id || !newItem.title) {
    return res.status(400).send('Invalid data');
  }

  const data = await readData();
  if (!data[type]) data[type] = [];

  data[type].push(newItem);
  await writeData(data);
  res.status(201).json(newItem);
});

// ✅ PUT update item by ID
app.put('/api/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const updatedItem = req.body;
  const data = await readData();

  if (!data[type]) return res.status(404).send('Invalid type');

  const index = data[type].findIndex(item => item.id == id);
  if (index === -1) return res.status(404).send('Item not found');

  data[type][index] = updatedItem;
  await writeData(data);
  res.json(updatedItem);
});

// ✅ DELETE item by ID
app.delete('/api/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const data = await readData();

  if (!data[type]) return res.status(404).send('Invalid type');

  data[type] = data[type].filter(item => item.id != id);
  await writeData(data);
  res.sendStatus(204);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
