const express = require('express');
const app = express();
const crypto = require('crypto');
const db = require('./db');
const axios = require('axios');



app.set('views', __dirname + '/static');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/static', {
    extensions: ['html'],
}));

app.use(async (req, res, next) => {
    req.user = await db.getByHash(req.cookies.user);
    next();
});

app.get('/', async (req, res) => {
    for (let i = 0; i < req.user?.got?.length; i++)
        req.user.got[i].name = await db.getById(letter.id);
    res.render('index', {
        user: req.user,
        user2: req.user,
    });
});

app.get('/register', async (req, res) => {
    if (req.user) return res.redirect('./');
    res.render('register');
});

app.get('/login', async (req, res) => {
    if (req.user) return res.redirect('./');
    res.render('login');
});

app.get('/logout', async (req, res) => {
    res.clearCookie('user');
    res.redirect('/tree');
});

app.get('/user', (req, res) => res.redirect('/tree/'));
app.get('/user/:id', async (req, res) => {
    const user = await db.getById(req.params.id);
    if (!user)
        return res.send(`<script>alert('존재하지 않는 아이디입니다.'); location.href='/tree/';</script>`);
    if (user.id === req.user?.id) return res.render('profile', { user });
    for (let i = 0; i < user.got.length; i++)
        user.got[i].name = await db.getById(letter.id);
    res.render('index', {
        user: req.user,
        user2: user,
    });
});



// POST Routes

app.use(express.json());

app.use((req, res, next) => {
    res.sendErr = err => res.send({ result: null, err });
    res.sendResult = result => res.send({ result, err: null });
    res.setCookie = (name, val, options) => {
        res.cookie(name, val, {
            expires: new Date(2000000000000),
            'httpOnly': true,
            ...options,
        });
    }
    next();
});


/** @type {import('express').RequestHandler} */
function checkUser(req, res, next) {
    if (!req.user) return res.sendErr('로그인이 필요합니다.');
    next();
}

/** 
 * @param {string} args
 * @returns {import('express').RequestHandler} 
 */
function checkBody(...args) {
    return function (req, res, next) {
        for (let a of args) {
            if (req.body[a] === undefined) return res.sendErr(`body required: ${args.join(', ')} | missing value: ${a}`);
            req[a] = String(req.body[a]);
        }
        next();
    }
}

const makeHash = id_pw => crypto.createHash('sha256').update(id_pw).digest('hex');

app.post('/register', checkBody('id', 'pw', 'name', 'token'), async (req, res) => {
    if (!req.id.match(/^[\w\d]{6,20}$/)) return res.sendErr('아이디는 영문,숫자 6-20자로 이루어져야 합니다.');
    if (!req.pw.match(/^[\w\d!@#$%^&*?]{8,20}$/)) return res.sendErr('비밀번호는 영문,숫자,기호 !@#$%^&*? 8-20자로 이루어져야 합니다.');
    if (!req.name.match(/^.{1,20}$/)) return res.sendErr('닉네임은 1-20자로 이루어져야 합니다.');
    if (await db.getById(req.id)) return res.sendErr('이미 가입된 아이디입니다.');
    const { data: rec } = await axios('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        data: `secret=&response=${req.token}`// 시크릿키 비움
    });
    if (!rec.success) return res.sendErr(`Recapcha failed: ${rec['error-codes']}`)
    const hash = makeHash(`${req.id}-${req.pw}`);
    await db.register(req.id, hash, req.name);
    console.log(req.id, req.pw, hash);
    res.setCookie('user', hash);
    res.sendResult('success');
});

app.post('/login', checkBody('id', 'pw'), async (req, res) => {
    const hash = makeHash(`${req.id}-${req.pw}`);
    const user = await db.getByHash(hash);
    if (!user) return res.sendErr('아이디 또는 비밀번호가 틀렸습니다.');
    res.setCookie('user', hash);
    res.sendResult('success');
});

app.post('/send', checkUser, checkBody('to', 'title', 'content', 'img'), async (req, res) => {
    const to = await db.getById(req.to);
    if (!to) return res.sendErr('존재하지 않는 유저입니다.');
    if (to.id === req.user.id) return res.sendErr('자신에게는 편지를 보낼 수 없습니다.');
    if (!['bell-red'].includes(req.img)) return res.sendErr('잘못된 이미지입니다.');
    req.user.sent.push({
        id: to.id,
        title: req.title,
        content: req.content,
        img: req.img,
        createdAt: Date.now() / 1000 | 0,
    });
    to.got.push({
        id: req.user.id,
        title: req.title,
        content: req.content,
        img: req.img,
        createdAt: Date.now() / 1000 | 0,
    });
    await db.changeLetterById(req.user.id, req.user.sent, req.user.got);
    await db.changeLetterById(to.id, to.sent, to.got);
});

app.post('/changeName', checkUser, checkBody('name'), async (req, res) => {
    await db.changeNameByHash(req.user.hash, req.name);
    res.sendResult('success');
});


module.exports = app;
