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

// Draw the button in `holder`; `onToken(idToken)` runs when the student has signed in with Google.
export async function showGoogleButton(holder, clientId, onToken) {
  const google = await loadGoogle();
  google.accounts.id.initialize({ client_id: clientId, callback: (response) => onToken(response.credential), cancel_on_tap_outside: false });
  google.accounts.id.renderButton(holder, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 260 });
}
