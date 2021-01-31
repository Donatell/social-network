import React from 'react';
import { Link } from 'react-router-dom';

const DashboardActions = (props) => {
	return (
		<div className='dash-buttons'>
			<Link to='/edit-profile' className='btn'>
				<i className='fas fa-user-circle btn-primary'></i> Edit Profile
			</Link>
			<Link to='/add-experience' className='btn'>
				<i className='fab fa-black-tie btn-primary'></i> Add Experience
			</Link>
			<Link to='/add-education' className='btn'>
				<i className='fas fa-graduation-cap btn-primary'></i> Add Education
			</Link>
		</div>
	);
};

export default DashboardActions;
