const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const yup = require('yup');
const { nanoid } = require('nanoid');
const monk = require('monk');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true })); 
app.set('view engine', 'ejs');

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
    let url = req.body.name;
    if(url.startsWith('https') == false){
        url = ('https://').concat(url);
    }
    console.log(url);
    let slug = req.body.slug;
    if(slug === ''){
        slug = nanoid(5);
        console.log('generated slug: ' +slug);
    }
    console.log(req.body);
    try{
        await schema.validate({
            slug,
            url,
        })
        slug = req.body.slug;
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
        //res.json(created);
        const name = created.url;
        const alias = created.slug;
        console.log(created.url);
        console.log(created.slug);
        res.render('confirm', {
            name: name,
            alias: alias
        });
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
    var message = error.message;
    var stack= process.env.NODE_ENV === 'production' ? 'works' : error.stack;
    res.render('404', { message: message});
    console.log(message);
    console.log(stack);
});

port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening...`)
});