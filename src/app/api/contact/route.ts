// app/api/contact/route.ts
import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const resend = new Resend(process.env.RESEND_API_KEY);
	const { first_name, email, form_message, website } = await req.json();

	// Honeypot: bots fill hidden fields, humans don't
	if (website) return NextResponse.json({ success: true });

	if (!first_name || !email || !form_message) {
		return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
	}

	const { error } = await resend.emails.send({
		from: "onboarding@resend.dev", // verified domain (see below)
		to: "slavikkost5@gmail.com", // where YOU receive it
		replyTo: email, // reply goes straight to sender
		subject: `New message from ${first_name}`,
		text: form_message,
	});

	if (error) {
		return NextResponse.json({ detail: "Send failed" }, { status: 500 });
	}
	return NextResponse.json({ success: true });
}
