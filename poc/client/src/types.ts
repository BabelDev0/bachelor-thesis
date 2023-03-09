enum EventType {
	USER_REGISTERED = 'userRegistered',
	USER_SLASHED = 'userSlashed',
	REGISTER = 'register',
	INTERACTION = 'interaction',
	RECEIVE_SIGNAL = 'receivesignal',
}

enum SignalVerificationStatus {
	BREACH = 'breach',
	INVALID = 'invalid',
	VALID = 'valid',
}

enum UserRegistrationStatus {
	ALREADY_REGISTERED = 'alreadyRegistered',
	BANNED = 'banned',
	VALID = 'valid',
}

export { EventType, SignalVerificationStatus, UserRegistrationStatus };
