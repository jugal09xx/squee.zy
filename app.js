const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const yup = require('yup');
const { nanoid } = require('nanoid');
const monk = require('monk');
require('dotenv').config();

const app = express();

const db = monk(process.env.MONGO_URI);
db.then(() => {
    console.log('db connected...');
})
const urls = db.get('urls');
urls.createIndex('name');

app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

const schema = yup.object().shape({
    slug: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().url().required(),
});

app.get("/:id", async (req, res, next) => {
    const { id: slug } = req.params;
    try{
        const url = await urls.findOne({ slug });
        if(url) {
            res.redirect(url.url);
        } else {
            res.send('slug not found!'); //slug not found!
            console.log(`${slug} not found`); 
        }
    } catch(error){
        console.log(error);
        console.log('link not found');
    }
});

app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    try{
        await schema.validate({
            slug,
            url,
        })
        if(!slug){
            slug = nanoid(5);
        } else {
            const existing = await urls.findOne({ slug });
            if(existing){
                throw new Error('Slug in use!');
            }  
        }
        slug = slug.toLowerCase();
        const newUrl = {
            url,
            slug,
        };
        const created = await urls.insert(newUrl);
        res.json(created);
    } catch(error){
        next(error);
    }
})

app.use((error, req, res, next) => {
    if(error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'works' : error.stack,
    })
});

port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening...`)
});