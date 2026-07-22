export interface ContactFormData {
	first_name: string;
	email: string;
	form_message: string;
}

export interface ContactFormResponse {
	success: boolean;
	message: string;
}
