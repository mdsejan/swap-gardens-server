const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Swap Gardens server is running')
})

app.listen(port, () => {
    console.log(`Swap Gardens is running on port: ${port}`);
})