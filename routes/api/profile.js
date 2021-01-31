const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.js');
const { check, validationResult } = require('express-validator');
const request = require('request');

const Profile = require('./models/Profile.js');
const Post = require('./models/Post.js');
const User = require('./models/User.js');

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access	 Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id
		}).populate('user', ['name, avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}

		res.json(profile);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server Error');
	}
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access	 Private
router.post(
	'/',
	[
		auth,
		[check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills are required').not().isEmpty()]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body;

		// build profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map((skill) => skill.trim());
		}

		// build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (facebook) profileFields.social.facebook = facebook;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });
			if (profile) {
				// update profile
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
				return res.json(profile);
			}

			// create new profile
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server Error');
		}
	}
);

// @route    GET api/profile
// @desc     Get all profiles
// @access	 Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find({}).populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (error) {
		console.log(error.message);
		res.status(500).send('Server Error');
	}
});

// @route    GET api/profile/user/:user_id
// @desc     Get user profile by user id
// @access	 Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(404).json({ msg: 'Profile not found' });
		}

		res.json(profile);
	} catch (error) {
		if (error.kind) {
			return res.status(404).json({ msg: 'Profile not found' });
		}

		console.log(error.message);
		res.status(500).send('Server Error');
	}
});

// @route    DELETE api/profile
// @desc     Delete personal profile and user by authentication
// @access	 Private
router.delete('/', auth, async (req, res) => {
	try {
		// @todo - remove user's posts
		await Post.deleteMany({ user: req.user.id });
		// remove profile
		await Profile.findOneAndRemove({ user: req.user.id });
		// remove user
		await User.findByIdAndRemove({ _id: req.user.id });
		res.json({ msg: 'The user has been deleted successfully' });
	} catch (error) {
		console.log(error.message);
		res.status(500).send('Server Error');
	}
});

// @route    PUT api/profile
// @desc     Add profile experience
// @access	 Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { title, company, location, from, to, current, description } = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server Error');
		}
	}
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete profile experience by experience ID
// @access	 Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		profile.experience = profile.experience.filter((exp) => exp._id.toString() !== req.params.exp_id);
		await profile.save();
		res.json(profile);
	} catch (error) {
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access	 Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'school is required').not().isEmpty(),
			check('degree', 'degree is required').not().isEmpty(),
			check('fieldofstudy', 'Field of study is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { school, degree, fieldofstudy, from, to, current, description } = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(newEdu);
			await profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server Error');
		}
	}
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete profile education by education ID
// @access	 Private
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		profile.education = profile.education.filter((edu) => edu._id.toString() !== req.params.edu_id);
		await profile.save();
		res.json(profile);
	} catch (error) {
		console.error(error);
		res.status(500).send('Server Error');
	}
});

// @route    GET api/profile/github/:username
// @desc     Get users repositories from github
// @access	 Public
router.get('/github/:username', async (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${process.env.githubClientID}&client_secret=${process.env.githubClientSecret}`,
			method: 'GET',
			headers: { 'user-agent': 'node-js' }
		};

		request(options, (error, response, body) => {
			if (error) return console.error(error);

			if (response.statusCode !== 200) {
				return res.status(404).json({ msg: 'No Github profile found' });
			}

			res.json(JSON.parse(body));
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Server Error');
	}
});

module.exports = router;
