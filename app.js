const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const e = require('express');

//MILLISECOND TIMES A MINUTE TIMES AN HOUR TIMES 2 = 2 HOURS
const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    PORT = 3000,

    NODE_ENV = 'development',

    SESS_NAME = 'sid',
    SESS_SECRET = 'heyokeepyamouthshut',
    SESS_LIFETIME = TWO_HOURS
} = process.env;

const IN_PROD = NODE_ENV === 'production';

//TODO: DB

const users = [
    {id: 1, name: 'Henry', email: 'henry@gmail.com', password: 'test'},
    {id: 2, name: 'Doodle', email: 'doodlethewriter@gmail.com', password: 'test'},
    {id: 3, name: 'Emily', email: 'zombuscus@gmail.com', password: 'test'},
]

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
        maxAge: SESS_LIFETIME,
        sameSite: true, // 'strict'
        secure: IN_PROD
    }
}));

const redirectLogin = (req, res, next) => {
    if(!req.session.userId) {
        res.redirect('/login');
    }else {
        next();
    }
}

const redirectHome = (req, res, next) => {
    if(req.session.userId) {
        res.redirect('/home');
    }else {
        next();
    }
}

app.get('/', (req, res) => {
    const {userId } = req.session;
    console.log(req.session)
    res.send(`
        <h1>Welcome!</h1>
        ${userId ? `
            <a href='/home'>Home</a>
            <form method='post' action='/logout'>
                <button>Logout</button>
            </form>
        ` : `
            <a href='/login'>Login</a>
            <a href='/register'>Register</a>
        `}
    `);
});

app.use((req, res, next) => {
    const { userId } = req.session;
    if(userId) {
        res.locals.user = users.find(user => user.id === req.session.userId);
    }
    next();
});

app.get('/home', redirectLogin, (req, res) => {
    const { user } = res.locals;
    res.send(`
        <h1>Home</h1>
        <a href="/">Main</a>
        <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
        </ul>
    `);
});

app.get('/login',  redirectHome, (req, res) => {
    // req.session.userId =
    res.send(`
        <h1>Login</h1>
        <form method='post' action='/login'>
            <input type='email' name='email' placeholder='Email here' required />
            <input type='password' name='password' placeholder='Password here' required />
            <input type='submit'/>
        </form>
        <a href='/register'>Register</a>
    `);
});

app.get('/register', (req, res) => {
    res.send(`
        <h1>Register</h1>
        <form method='post' action='/register'>
            <input name='name' placeholder='Enter your name' required />
            <input type='email' name='email' placeholder='Email here' required />
            <input type='password' name='password' placeholder='Password here' required />
            <input type='submit'/>
        </form>
        <a href='/login'>Login</a>
    `);
});

app.post('/login', redirectHome, (req, res) => {
    const { email, password } = req.body;

    if(email && password) { //TODO: VALIDATION
        const user = users.find(
            user => user.email === email && user.password === password //TODO: hash
        );

        if (user) {
            req.session.userId = user.id;
            return res.redirect('/home');
        }
    }

    res.redirect('/login');
});

app.post('/register', redirectHome, (req, res) => {
    const { name, email, password } = req.body;

    if(name && email & password) { //TODO: VALIDATION
        const exists = users.some(
            user => user.email === email
        )

        if(!exists) {
            const user = {
                id: users.length + 1,
                name,
                email,
                password //TODO: HASH
            }

            users.push(user);

            req.session.userId = user.id;

            return res.redirect('/home');
        }
    }

    res.redirect('/register') //TODO: qs errors
});

app.post('/logout', redirectLogin, (req, res) => {
    req.session.destroy(err => {
        if(err){
            return res.redirect('/home')
        }

        res.clearCookie(SESS_NAME);
        res.redirect('/login');
    }) 
});

app.listen(PORT, () => console.log(
    `http://localhost:${PORT}`
));