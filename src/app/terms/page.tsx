import type { Metadata } from "next";
import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";

export const metadata: Metadata = { title: "Terms of Use" };

// Plain-language draft. Have counsel review before launch, then bump
// TERMS_VERSION in src/lib/legal/versions.ts whenever the substance changes.
export default function TermsPage() {
  return (
    <main className="legal-page">
      <QuietHeader />
      <article>
        <p className="eyebrow">Terms of Use</p>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Last updated November 3, 2026</p>

        <h2>The short version</h2>
        <ul>
          <li>Your story stays yours. You decide what is shared and you can take it down.</li>
          <li>Your stories post as soon as you share them, like a social post. Drafts stay private until then.</li>
          <li>Be truthful, be kind, and only share what is yours to share.</li>
        </ul>

        <h2>1. Using HUMAN:HERE</h2>
        <p>HUMAN:HERE is operated by Human Here (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Anyone can read published stories without an account. To share a story, send a note, or send love you need an account. You must be 18 or older, or have a parent or guardian&rsquo;s permission. A story about a child is published only with a parent or guardian&rsquo;s verified consent.</p>

        <h2>2. Your account</h2>
        <p>You sign in with a link sent to your email address, a password, or your Google or Apple account. Keep your password and your inbox secure; anyone who can use them can open your account. Tell us at <a href="mailto:hello@humanhere.co">hello@humanhere.co</a> if you think someone else has used it.</p>

        <h2>3. Your profile and following</h2>
        <p>Your account has a public profile with the @username you choose, your name, bio and profile photo, your level and rank, and how many people follow you and how many you follow. Signed-in members can also see who follows you and who you follow, unless you hide those lists in Settings. Your published stories appear on it unless you shared them anonymously. You can follow other members to see their published stories in one place, and anyone signed in can report a published story to us.</p>

        <h2>4. Your stories and what we may do with them</h2>
        <p>You keep ownership of everything you share. When you share a story, you give us permission to publish it straight away, with the photos, video or audio you added. If you tell us you would like help, you also allow us to contact you and, when you ask for practical help or resources, to connect you with a partner organization. We feature your stories on our own social media only if you turn that on in your account settings; it is off until you do.</p>
        <p>For the things you allow, you give HUMAN:HERE permission to host, display, format and share that story for as long as your permission stands. This permission is free of charge, is not exclusive, and ends when you withdraw it.</p>

        <h2>5. Changing your mind</h2>
        <p>You can unpublish, edit or delete a story from your account at any time. Unpublishing takes the story and its public media off HUMAN:HERE right away. Copies that other people made or shared before then, including on social media, are outside our control; if we posted your story on our own social accounts, we will remove those posts when you ask.</p>

        <h2>6. Posting and safety</h2>
        <p>Stories are not reviewed before they post. An automatic check holds back a story that looks like it contains a phone number, email address or street address, so our team can look at it first. Anyone signed in can report a published story, and our team may take down any story, for example when it could put someone at risk or does not meet these terms. We may add automated review in the future.</p>

        <h2>7. What you agree not to share</h2>
        <ul>
          <li>Stories that are not yours, or that you do not have the right to share.</li>
          <li>Private details about another person, such as their full name, address, health or legal situation, without their permission.</li>
          <li>Anything false, hateful, harassing, threatening, sexually explicit, or unlawful.</li>
          <li>Requests for money, advertising, or spam.</li>
        </ul>

        <h2>8. Notes and love</h2>
        <p>Notes you send to a published story are private encouragement. Moderators review them before the recipient sees them, and the recipient is not shown who sent them. Recipients can hide or report a note. We may suspend note sending for accounts that misuse it.</p>

        <h2>9. Help and partners</h2>
        <p>HUMAN:HERE shares stories and may connect people with partner organizations when asked. We do not promise that any specific help will be provided. Nothing on HUMAN:HERE is medical, legal, financial or crisis advice. If you or someone else is in immediate danger, contact your local emergency services.</p>

        <h2>10. Our content</h2>
        <p>The HUMAN:HERE name, design, and editorial content belong to HUMAN:HERE. Please do not copy other people&rsquo;s stories or media from the site without their permission.</p>

        <h2>11. Ending your account</h2>
        <p>You can stop using HUMAN:HERE at any time and ask us to delete your account. We may suspend or close an account that breaks these terms.</p>

        <h2>12. The service as it is</h2>
        <p>We work to keep HUMAN:HERE available and safe, but we provide it as it is and cannot promise it will always be available or free of errors. To the extent the law allows, HUMAN:HERE is not liable for indirect or consequential loss arising from use of the site.</p>

        <h2>13. Changes to these terms</h2>
        <p>If we change these terms in a way that matters, we will ask you to agree again the next time you sign in.</p>

        <h2>14. Contact</h2>
        <p>Questions about these terms: <a href="mailto:hello@humanhere.co">hello@humanhere.co</a>. See also our <Link href="/privacy">Privacy Policy</Link>.</p>
      </article>
    </main>
  );
}
