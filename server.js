const express = require('express');
const connectDB = require('./config/db.js');

const app = express();

// connect database
connectDB();

// init middleware
app.use(express.json({ extend: false }));

// define routes
app.use('/api/users', require('./routes/api/users.js'));
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/api/profile', require('./routes/api/profile.js'));
app.use('/api/posts', require('./routes/api/posts.js'));

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log('The server is up on port ' + PORT);
});
