import { initRLN, register, options } from './api';

const main = async () => {
	try {
		await initRLN();

		const userRegistrationStatus = await register();
		console.log('Server response: ', userRegistrationStatus);

		for (let i = 0; i < 10; i++) {
			const response = await options();
			console.log('Server response: ', response);
		}
	} catch (error) {
		throw new Error(error);
	}
};

main();
