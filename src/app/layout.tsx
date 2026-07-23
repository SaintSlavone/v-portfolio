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
				src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
				strategy="afterInteractive"
			/>

			<Script id="ga4" strategy="afterInteractive">
				{`
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
					  `}
			</Script>
			<body className={`${montserrat.variable} ${inter.variable}`}>
				{/* Runs before the overlay paints: the intro is rendered from the
				    first paint so it covers the hub with no flash on first visit,
				    but returning / reduced-motion visitors should never see it —
				    flag the document here so CSS hides it before it can show. */}
				<script
					dangerouslySetInnerHTML={{
						__html: `try{if(sessionStorage.getItem('intro-played')||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.introSkip='1'}}catch(e){}`,
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
