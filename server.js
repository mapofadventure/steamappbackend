const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const games = require('./routes/api/games.js');
const importsteamdata = require('./importsteamdata.js');


app.use(bodyParser.json());

app.use('/api/games', games);


const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));