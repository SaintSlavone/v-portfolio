import type { Metadata } from "next";
import "./Contacts.scss";
import "./Adaptations.scss";
import contacts from "@/data/contacts.json";
import site from "@/data/site.json";
import ContactForm from "@/components/contact-form/ContactForm";
import JsonLd from "@/components/json-ld/JsonLd";
import { pageGraph } from "@/components/json-ld/schemas";

const description = `Get in touch with Viacheslav Kostenko — software developer based in ${contacts.location}. Email, GitHub, LinkedIn or the contact form.`;

export const metadata: Metadata = {
	title: "Contacts",
	description,
	alternates: { canonical: "/contacts" },
	openGraph: {
		url: "/contacts",
		title: `Contacts · ${site.name}`,
		description,
		images: ["/opengraph-image"],
	},
};

export default function ContactsPage() {
	return (
		<main className="contacts">
			<JsonLd
				data={pageGraph({
					path: "/contacts",
					name: `Contacts · ${site.name}`,
					type: "ContactPage",
				})}
			/>
			<h1 className="contacts-title">Contacts</h1>
			<div className="contacts-inner-container">
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
				<ContactForm />
			</div>
		</main>
	);
}
