// Google's sign-in button (Google Identity Services). Loaded only when the class sheet says Google sign-in is on. It
// hands back an ID token, which goes to the class sheet's script, which checks it with Google; the app never reads the
// student's name or email.

let loading = null;

export function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => { loading = null; script.remove(); reject(new Error('Couldn’t load Google sign-in. Check your connection and try again.')); };
      document.head.append(script);
    });
  }
  return loading;
}

// Google wants its sign-in set up once per page: the callback is kept here and swapped for the current dialog's.
let onToken = null;
let initializedFor = null;

// Draw the button in `holder`; `handler(idToken)` runs when the student has signed in with Google.
export async function showGoogleButton(holder, clientId, handler) {
  const google = await loadGoogle();
  onToken = handler;
  if (initializedFor !== clientId) {
    google.accounts.id.initialize({ client_id: clientId, callback: (response) => onToken?.(response.credential), cancel_on_tap_outside: false });
    initializedFor = clientId;
  }
  google.accounts.id.renderButton(holder, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 260 });
}
