"use client"; // required: uses useState + event handlers

import "./ContactForm.scss";
import "./Adaptations.scss";
import { useState } from "react";

interface FormData {
	first_name: string;
	email: string;
	form_message: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
	const [formData, setFormData] = useState<FormData>({
		first_name: "",
		email: "",
		form_message: "",
	});
	const [website, setWebsite] = useState(""); // honeypot
	const [status, setStatus] = useState<Status>("idle");
	const [errorMsg, setErrorMsg] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("loading");
		setErrorMsg("");

		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...formData, website }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.detail || "Something went wrong");
			}

			setStatus("success");
			setFormData({ first_name: "", email: "", form_message: "" });
		} catch (err) {
			setStatus("error");
			setErrorMsg(err instanceof Error ? err.message : "Failed to send");
		}
	};

	const loading = status === "loading";

	return (
		<form onSubmit={handleSubmit} className="contact-form">
			<h2 className="form-title">Send message</h2>

			<div className="form-fields">
				<input
					className="form-input"
					type="text"
					name="first_name" // matches state key + route contract
					placeholder="Name"
					aria-label="Name"
					value={formData.first_name}
					onChange={handleChange}
					disabled={loading}
					required
				/>
				<input
					className="form-input"
					type="email"
					name="email"
					placeholder="E-mail"
					aria-label="E-mail"
					value={formData.email}
					onChange={handleChange}
					disabled={loading}
					required
				/>
			</div>

			<textarea
				className="form-message"
				name="form_message"
				placeholder="Your message"
				aria-label="Your message"
				value={formData.form_message}
				onChange={handleChange}
				disabled={loading}
				rows={5}
				required
			/>

			{/* Honeypot: hidden from humans, only bots fill it */}
			<input
				type="text"
				name="website"
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
				value={website}
				onChange={(e) => setWebsite(e.target.value)}
				style={{ position: "absolute", left: "-9999px" }}
			/>

			{status === "success" && (
				<p className="form-status form-status--ok">Thanks! Your message has been sent.</p>
			)}
			{status === "error" && <p className="form-status form-status--err">{errorMsg}</p>}

			<button className="form-send" type="submit" disabled={loading}>
				{loading ? "Sending…" : <>Send&ensp;→</>}
			</button>
		</form>
	);
}
