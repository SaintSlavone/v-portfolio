interface JsonLdProps {
	data: Record<string, unknown>;
}

// Structured data for search engines / AI crawlers. A plain <script> (not
// next/script) is the right tag — this is data, never executed. "<" is escaped
// so page copy can't break out of the tag and inject markup.
export default function JsonLd({ data }: JsonLdProps) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
