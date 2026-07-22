import Hub from "@/components/hub/Hub";
import Intro from "@/components/intro/Intro";
import JsonLd from "@/components/json-ld/JsonLd";
import { pageGraph } from "@/components/json-ld/schemas";
import site from "@/data/site.json";

export default function Home() {
	return (
		<>
			<JsonLd data={pageGraph({ path: "/", name: site.title })} />
			<Intro />
			<Hub />
		</>
	);
}
