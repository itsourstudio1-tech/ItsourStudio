# Ownership Transfer Plan for "it's ouR Studio" Website

This document outlines the step-by-step process for transferring full ownership of the website, codebase, and associated accounts from the developer to the client ("it's ouR Studio").


---

## 🏆 Preferred Approach: Remote "White Glove" Session

**Why this works best:**
*   Minimizes technical confusion for the client.
*   Ensures client privacy (they type their own passwords).
*   Guarantees immediate completion (no waiting for them to check emails).

**Recommended Tools:**
*   **Zoom** or **Google Meet**: Both allow screen sharing. Zoom allows "Request Remote Control" which is easiest.
*   **AnyDesk** / **TeamViewer**: Good alternatives if calling isn't an option.

**The Workflow:**
1.  Start the meeting.
2.  Client shares screen.
3.  **Request Remote Control**.
4.  Open their browser and navigate to Vercel/Firebase.
5.  *Pass control back* when they need to log in or create an account.
6.  *Resume control* to click "Accept Transfer" or configure settings.

---

## 1. Preparation & Pre-Requisites

Before starting the transfer, ensure the client has the following accounts set up:

*   **GitHub Account**: For hosting the source code.
*   **Vercel Account**: For hosting the live website (Free tier is usually sufficient).
*   **Google/Gmail Account**: For accessing the Firebase Console (Database & Storage).

---

## 2. Firebase Transfer (Database & Storage)

Since the website uses Firebase for the database (bookings, gallery, reviews) and storage (images), this is the most critical step.

### Option A: Transfer Existing Project (Recommended)
This preserves existing data (bookings, photos).

1.  **Log in** to the [Firebase Console](https://console.firebase.google.com/).
2.  Select the **it's ouR Studio** project.
3.  Go to **Project settings** (gear icon) > **Users and permissions**.
4.  Click **Add member**.
5.  Enter the **Client's Email Address**.
6.  Assign the role **Owner**.
7.  Click **Done**.
8.  *Once the client accepts the invitation*, they will become an Owner.
9.  **After the transition period**, you can remove your own account from the project to finalize the handover.

### Option B: Create New Project (If cleanliness is preferred)
If the client wants a fresh start:
1.  Client creates a new Firebase project.
2.  You update the `src/firebase.ts` (or equivalent config file) with the new credentials.
3.  Deploy the Firestore Rules and Indexes to the new project.

---

## 3. GitHub Repository Transfer (Codebase)

This moves the actual code to the client's control.

1.  Go to the repository on GitHub (`ItsourStudioNew`).
2.  Click **Settings** > **General**.
3.  Scroll to the bottom to the **Danger Zone**.
4.  Click **Transfer repository**.
5.  Enter the **Client's GitHub username** or organization name.
6.  Confirm the transfer.
7.  The client will receive an email to accept the transfer.

*Alternative*: If the client prefers not to manage GitHub, you can provide a `.zip` file of the source code, but this makes future updates harder.

---

## 4. Vercel Project Transfer (Hosting)

This ensures the live website URL and hosting management belong to the client.

1.  Log in to your **Vercel Dashboard**.
2.  Select the **it's ouR Studio** project.
3.  Go to **Settings** > **General**.
4.  Scroll down to **Transfer Project**.
5.  Enter the **Client's Vercel Account Scope/Slug** (they can find this in their Vercel profile).
6.  Click **Transfer**.
7.  The client receives a notification to accept the project.

**Note**: Environment variables (like Firebase keys) usually transfer with the project, but double-check them in the client's Vercel Settings > Environment Variables after transfer.

---

## 5. Domain Name (If Applicable)

*   **If using `itsour-studio.vercel.app`**: The URL transfers automatically with the Vercel project.
*   **If using a Custom Domain (e.g., `itsourstudio.com`)**:
    1.  If you managed the domain: Unlock the domain at your registrar and provide the "Transfer Auth Code" to the client so they can move it to their registrar (e.g., GoDaddy, Namecheap).

    2.  If they already own the domain: They just need to ensure the DNS records point to the Vercel project.

### 💡 Quick Guide: Connecting Namecheap to Vercel
1.  **On Vercel**:
    *   Go to **Settings > Domains**.
    *   Enter the domain (e.g., `itsourstudio.com`) and click **Add**.
    *   It will show you two values: an **A Record** (usually `76.76.21.21`) and a **CNAME** (usually `cname.vercel-dns.com`).

2.  **On Namecheap**:
    *   Log in and go to **Domain List**.
    *   Click **Manage** next to the domain.
    *   Go to the **Advanced DNS** tab.
    *   **Delete** any existing A records or CNAME records for `@` or `www` (to avoid conflicts).
    *   Add New Record: **A Record** | Host: `@` | Value: `76.76.21.21`
    *   Add New Record: **CNAME Record** | Host: `www` | Value: `cname.vercel-dns.com`
    *   Save changes. (It may take up to 24-48 hours to propagate, but usually happens in minutes).

---

## 6. Admin Credentials Handover

Securely share the initial admin credentials for the website dashboard.

1.  **Admin Login URL**: `https://itsour-studio.vercel.app/admin/login`
2.  **Default Admin Email**: `[Current Admin Email]`
3.  **Default Password**: `[Current Admin Password]`
4.  **Action Item**: Instruct the client to change the password immediately after logging in (if a password change feature exists) or update the admin user in Firebase Authentication.

---

## 7. Support & Transition Period

Define a period (e.g., 2 weeks) where you will remain available to help with any issues.

1.  **Monitor the site** for 48 hours after transfer to ensure DNS and Database connections remain stable.
2.  **Walkthrough Session**: Offer a 30-minute Google Meet/Zoom call to show them how to use the Admin Dashboard and Vercel/Firebase consoles basics.

---


---

## 8. Mobile & Desktop App Assets

Since the project includes a mobile (Android) and desktop (Windows) version:

1.  **APK & Installer Files**: Provide the latest compiled versions (`.apk` for Android, `.msi`/`.exe` for Windows) via a Google Drive link or USB drive.
2.  **Signing Keys (Crucial)**: If you generated specific "Release Keystores" to sign the apps, you **MUST** securely send these files (e.g., `release.keystore`, `.pfx`) and their passwords to the client. Without these, they cannot update the app on the Play Store/Microsoft Store in the future.
    *   *If you only used debug keys*, inform them that a new key will need to be generated for official store publication.
3.  **Play Store / Store Accounts**: If you haven't published them yet, guide the client to create their own **Google Play Console** account ($25 one-time fee) so they can publish the app under their own name.

---

## Checklist for You (Developer)

- [ ]  Clean up code (remove TODOs, unused files).
- [ ]  Verify `firebase.json` and `firestore.rules` are up to date.
- [ ]  Ensure local `.env` variables are documented for the client.
- [ ]  Send the "Handover Email" with the Transfer Links.

