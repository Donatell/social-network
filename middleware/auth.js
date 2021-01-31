const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
	// get token from header
	const token = req.header('x-auth-token');

	// check is no token
	if (!token) {
		return res.status(401).json({
			errors: [{ msg: 'Unauthorized: No Token' }]
		});
	}

	// verify token
	try {
		// returns decoded payload or throws error
		const decoded = jwt.verify(token, process.env.jwtSecret);

		// the decoded payload contains user with id
		req.user = decoded.user;
		next();
	} catch (error) {
		res.status(401).json({
			errors: [{ msg: 'Access denied: Token is not valid' }]
		});
	}
};
