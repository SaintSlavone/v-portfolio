import "./Contacts.scss";
import "./Adaptations.scss";
import contacts from "@/data/contacts.json";
import XCorners from "@/components/x-corners/XCorners";

export default function ContactsPage() {
	return (
		<main className="contacts">
			<XCorners position="top" />
			<h1 className="contacts-title">Contacts</h1>
			<ul className="contacts-list">
				<li className="contacts-row">
					<a href={`mailto:${contacts.email}`} className="contacts-email">
						{contacts.email}
					</a>
				</li>
				{contacts.links.map(({ label, handle, href }) => (
					<li key={label} className="contacts-row">
						<a href={href} target="_blank" rel="noreferrer" className="contacts-link">
							{label} · {handle}
						</a>
					</li>
				))}
				<li className="contacts-row contacts-location">{contacts.location}</li>
			</ul>
		</main>
	);
}
