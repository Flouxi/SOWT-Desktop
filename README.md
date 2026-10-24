# SOWT desktop preview

Mac (Apple silicon and Intel) and Windows x64 clients for https://app.sowt.ai.
These clients use the existing Cloudflare service and Supabase account; no
local web server, model runtime, provider key, or Orgo account is bundled.
Internet and an invited SOWT account are required. The current voice-language
settings and usage limits are the same as on the web.

Run `npm ci`, `npm test`, and `npm run build` on the target operating system.
The GitHub workflow builds both Mac architectures and a per-user Windows NSIS
installer. The application uses the approved SOWT symbol as its icon.

## Security boundary

Only https://app.sowt.ai runs inside the window. Node integration and webviews
are disabled; sandboxing and context isolation are enabled. No renderer IPC or
preload is exposed. Other HTTPS links open in the system browser only after
the user confirms; file/custom-scheme URLs are refused. Only a top-level SOWT
page can request the microphone, and permission is asked in an explicit dialog.
Camera, screen capture, and other permissions are refused. Sessions persist in
Electron's normal per-user browser profile, and signing out remains in the app.

## Distribution status

Initial preview installers are **unsigned**, and Mac installers are **not
Apple-notarized**. Operating systems can block or warn about these downloads.
Do not present them as verified-publisher builds or automatic-update builds.
Public release needs SOWT's own Apple Developer ID/notarization and Windows
code-signing credentials. Never use Orgo's certificate or distribute its Bops
installer under the SOWT name. No certificate purchase or plan is enabled here.

Each packaged installer has a SHA-256 digest. Downloads should be published
only after both workflow jobs succeed and their artifact hashes are verified.
The hosted interface updates when SOWT is deployed; Electron runtime updates
require a new installer until signed updates are configured.
