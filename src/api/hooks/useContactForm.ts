import { useState } from "react";
import { ContactFormData, ContactFormResponse } from "@/types/contactForm";
import api from "../api";

interface UseContactFormReturn {
	submitContactForm: (data: ContactFormData) => Promise<ContactFormResponse>;
	loading: boolean;
	error: string | null;
	success: boolean;
}

export const useContactForm = (): UseContactFormReturn => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const submitContactForm = async (
		data: ContactFormData,
	): Promise<ContactFormResponse> => {
		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await api.post<ContactFormResponse>("/api/contact-forms", data);

			setSuccess(true);
			setLoading(false);
			return response;
		} catch (err: unknown) {
			const error = err as {
				response?: {
					data?: {
						detail?: string | { message?: string; error?: string; form_id?: number };
					};
				};
				message?: string;
			};

			let errorMessage: string;
			const detail = error?.response?.data?.detail;

			// Handle different detail formats
			if (typeof detail === "string") {
				// Backend returned a simple string error
				errorMessage = detail;
			} else if (typeof detail === "object" && detail !== null) {
				// Backend returned an object with message/error fields
				// Priority: message > error > fallback
				errorMessage = detail.message || detail.error || "Validation failed";
			} else {
				// No detail available, use generic message
				errorMessage =
					error?.message || "Validation failed. Please check your information and try again.";
			}

			setError(errorMessage);
			setLoading(false);
			setSuccess(false);

			throw new Error(errorMessage);
		}
	};

	return {
		submitContactForm,
		loading,
		error,
		success,
	};
};
