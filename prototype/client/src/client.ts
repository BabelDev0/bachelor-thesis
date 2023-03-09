import { initRLN, register, options } from './api';
const main = async () => {
	try {
		await initRLN();

		const userRegistrationStatus = await register();
		console.log('Server response: ', userRegistrationStatus);

		const userOptions = await options();
	} catch (error) {
		throw new Error(error);
	}
};

main();
