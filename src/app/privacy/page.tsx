import type { Metadata } from "next";
import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

// Plain-language draft. Have counsel review before launch, then bump
// TERMS_VERSION in src/lib/legal/versions.ts whenever the substance changes.
export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <QuietHeader />
      <article>
        <p className="eyebrow">Privacy Policy</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated November 3, 2026</p>

        <h2>The short version</h2>
        <ul>
          <li>We collect what we need to run your account and share the stories you choose to share.</li>
          <li>We do not sell your information or use it for advertising.</li>
          <li>You can see, change, unpublish and delete your stories from your account.</li>
        </ul>

        <p>HUMAN:HERE is operated by Human Here (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which is responsible for the information described here.</p>

        <h2>1. What we collect</h2>
        <ul>
          <li><b>Account details:</b> your email address, your @username, and the name, bio and profile photo you choose to show. If you sign in with Google or Apple, the basic profile details they share with us.</li>
          <li><b>Mailing address, if you add one:</b> the street address, city, state and ZIP code you save in Edit profile. It is optional, kept for when you ask for something to be sent to you, and you can remove it any time.</li>
          <li><b>Stories you write:</b> the text, the photos, video or audio you upload, and details you add such as a location or what would help. Stories can include sensitive information about your life; we use it only as you have allowed.</li>
          <li><b>Your permissions:</b> what each story you submitted allows, when you submitted it, which version of these terms applied, and whether you let us feature your stories on social media.</li>
          <li><b>Activity:</b> the stories you send love to, notes you send, the members you follow, stories you report, and requests you make to us.</li>
          <li><b>Technical details:</b> when you sign in we record your IP address and browser type to keep your account secure.</li>
        </ul>

        <h2>2. Who can see what</h2>
        <ul>
          <li><b>Your profile:</b> everyone: your profile photo, @username, name, bio, level and rank, when you joined, your follower and following counts, and your published stories that are not anonymous.</li>
          <li><b>Drafts:</b> only you.</li>
          <li><b>Stories held by the automatic check:</b> you and our team, until we publish or decline them.</li>
          <li><b>Published stories:</b> everyone, including the first name or &ldquo;Anonymous&rdquo;, the general location, and the media you added. If you give a location, the story can appear on the globe at the center of that city, state or country, never a precise spot.</li>
          <li><b>Notes sent to you:</b> our moderators, then only you. The sender&rsquo;s identity is not shown to you.</li>
          <li><b>Love:</b> everyone sees a total count. Who sent it stays private.</li>
          <li><b>Who you follow and who follows you:</b> signed-in members can see these lists on your profile, unless you turn on &ldquo;Hide who I follow and who follows me&rdquo; in Settings. Then others see only the counts and you are left out of other people&rsquo;s lists too. Visitors who are not signed in only ever see the counts.</li>
          <li><b>Reports:</b> our staff. The author is not told who reported a story.</li>
          <li><b>City and state on your profile:</b> everyone, if you add them.</li>
          <li><b>Your mailing address:</b> never shown publicly. Only our staff can see it, when you ask for something to be sent to you, and each time they do it is logged.</li>
          <li><b>Your email address:</b> never shown publicly.</li>
        </ul>

        <h2>3. How we use it</h2>
        <p>We use your information to run your account, publish the stories you share, check stories for personal contact details before they post, deliver notes, keep people safe, respond to your requests, and contact you if you allowed it. We rely on your consent for publishing and sharing your stories, and on our legitimate interest in running a safe service for the rest.</p>

        <h2>4. Who we share it with</h2>
        <p>We do not sell personal information. We share it only with:</p>
        <ul>
          <li><b>Service providers</b> that host the site, store data and files, handle sign-in, and deliver email on our behalf. Our database, sign-in and file storage are provided by Neon and hosted in the United States.</li>
          <li><b>Google or Apple,</b> only if you choose to sign in with them.</li>
          <li><b>Partner organizations,</b> only when you asked to be connected for a specific story.</li>
          <li><b>Authorities,</b> when the law requires it or to protect someone from serious harm.</li>
        </ul>

        <h2>5. Cookies</h2>
        <p>We use only the cookies needed to keep you signed in. We do not use advertising or cross-site tracking cookies. Your browser may also store an unfinished draft locally so you do not lose your work.</p>

        <h2>6. How long we keep it</h2>
        <ul>
          <li>Your stories and files stay until you delete them or ask us to.</li>
          <li>When you delete a story, its text and files are erased. We keep a small record of the permissions you gave for it (which choices, and when) so we can show that anything published was published with permission.</li>
          <li>Sign-in records expire on their own.</li>
        </ul>

        <h2>7. Your choices and rights</h2>
        <p>From your account you can edit, unpublish and delete your stories; change your photo, name, bio, @username and password; and delete your account yourself in Settings. You can also ask us for a copy of your information, to correct it, or to stop using it in a particular way. Depending on where you live, the law may give you further rights. Write to <a href="mailto:hello@humanhere.co">hello@humanhere.co</a> and we will respond.</p>

        <h2>8. Children</h2>
        <p>HUMAN:HERE is not directed at children under 13. People under 18 need a parent or guardian&rsquo;s permission to use an account, and a story about a child is published only with a parent or guardian&rsquo;s verified consent.</p>

        <h2>9. Other people in your story</h2>
        <p>Stories often involve family, friends and neighbors. Please do not identify another person or share private details about them without their permission. Anyone can ask us to remove information about themselves through <Link href="/remove-my-story">Remove my story</Link> or by email.</p>

        <h2>10. Security</h2>
        <p>Private stories and files are stored with access limited to you and the staff who review them. No service can promise perfect security; if something goes wrong that affects you, we will tell you.</p>

        <h2>11. Changes</h2>
        <p>If we change this policy in a way that matters, we will ask you to review it the next time you sign in.</p>

        <h2>12. Contact</h2>
        <p>Privacy questions and requests: <a href="mailto:hello@humanhere.co">hello@humanhere.co</a>. See also our <Link href="/terms">Terms of Use</Link>.</p>
      </article>
    </main>
  );
}
