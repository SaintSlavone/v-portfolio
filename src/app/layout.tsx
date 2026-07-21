import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./Main.scss";
import XField from "@/components/x-field/XField";

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
		<html lang="en">
			<body className={`${montserrat.variable} ${inter.variable}`}>
				<XField />
				{children}
			</body>
		</html>
	);
}
