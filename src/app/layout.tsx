import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./Main.scss";
import XField from "@/components/x-field/XField";
import PageStage from "@/components/page-stage/PageStage";
import PageExit from "@/components/page-exit/PageExit";

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

export const metadata: Metadata = {
	title: "Kostenko",
	description: "Viacheslav Portfolio",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
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
