const mongoose = require('mongoose');
const connectDB = async () => {
	try {
		mongoose.set('useNewUrlParser', true);
		mongoose.set('useCreateIndex', true);
		mongoose.set('useUnifiedTopology', true);
		mongoose.set('useFindAndModify', false);
		await mongoose.connect(process.env.mongoURI);

		console.log('MongoDB connected');
	} catch (error) {
		console.log(error.message);
		// exit process with failure
		process.exit;
	}
};

module.exports = connectDB;
