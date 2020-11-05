const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

/*
app.get('/url/:id', (req, res) => {
    //get a short url by id

});

app.get('/:id', (req, res) => {
    //redirect to url

});

app.post('/url', (req, res) => {
    //create a short url

}); */

port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening...`)
});