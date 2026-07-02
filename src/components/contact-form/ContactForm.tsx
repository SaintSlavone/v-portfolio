import "./ContactForm.scss";
import "./Adaptations.scss";

// Presentational for now: the send button stays disabled until
// the submit endpoint is wired up
export default function ContactForm() {
	return (
		<form className="contact-form">
			<h2 className="form-title">Send message</h2>
			<div className="form-fields">
				<input
					className="form-input"
					type="text"
					name="name"
					placeholder="Name"
					aria-label="Name"
				/>
				<input
					className="form-input"
					type="email"
					name="email"
					placeholder="E-mail"
					aria-label="E-mail"
				/>
			</div>
			<textarea
				className="form-message"
				name="message"
				placeholder="Your message"
				aria-label="Your message"
				rows={5}
			/>
			<button className="form-send" type="submit" disabled>
				Send&ensp;→
			</button>
		</form>
	);
}
