import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./Main.scss";
import XField from "@/components/x-field/XField";
import PageStage from "@/components/page-stage/PageStage";
import PageExit from "@/components/page-exit/PageExit";
import site from "@/data/site.json";
import Script from "next/script";

const montserrat = Montserrat({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-montserrat",
});

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "600"],
	variable: "--font-inter",
});

// metadataBase resolves every relative URL below (canonicals, OG images) —
// site.url is the single place the production domain is declared
export const metadata: Metadata = {
	metadataBase: new URL(site.url),
	title: {
		default: site.title,
		template: `%s · ${site.name}`,
	},
	description: site.description,
	keywords: site.keywords,
	applicationName: site.name,
	authors: [{ name: site.name, url: site.url }],
	creator: site.name,
	publisher: site.name,
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		url: "/",
		siteName: site.name,
		title: site.title,
		description: site.description,
		locale: site.locale,
	},
	twitter: {
		card: "summary_large_image",
		title: site.title,
		description: site.description,
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	themeColor: "#000000",
	colorScheme: "dark",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang={site.language} suppressHydrationWarning>
			<Script
				src="https://www.googletagmanager.com/gtag/js?id=G-HP5JLJVLXT"
				strategy="afterInteractive"
			/>

			<Script id="ga4" strategy="afterInteractive">
				{`
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', 'G-HP5JLJVLXT');
					  `}
			</Script>
			<body className={`${montserrat.variable} ${inter.variable}`}>
				{/* Runs before the overlay paints: the intro is rendered from the
				    first paint so it covers the hub with no flash on first visit,
				    but returning / reduced-motion / phone visitors should never see
				    it — flag the document here so CSS hides it before it can show.
				    The phone query mirrors Intro's PHONE_QUERY and Adaptations.scss. */}
				<script
					dangerouslySetInnerHTML={{
						__html: `try{var p='(max-width: 600px) and (max-height: 1000px) and (orientation: portrait),(max-width: 1000px) and (max-height: 600px) and (orientation: landscape)';if(sessionStorage.getItem('intro-played')||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia(p).matches){document.documentElement.dataset.introSkip='1'}}catch(e){}`,
					}}
				/>
				<PageExit>
					<XField />
					<PageStage>{children}</PageStage>
				</PageExit>
			</body>
		</html>
	);
}
