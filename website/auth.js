/* global supabase */

var vhfAuth = {
  client: null,
  session: null,
  pendingAfterSignIn: null,
};

function authRedirectTo() {
  return window.location.origin + window.location.pathname;
}

function getSignedInUser() {
  return vhfAuth.session && vhfAuth.session.user ? vhfAuth.session.user : null;
}

function getSignedInEmail() {
  var user = getSignedInUser();
  if (!user) {
    return "";
  }
  return user.email || (user.user_metadata && user.user_metadata.email) || "";
}

function isSignedIn() {
  return !!getSignedInUser();
}

function authConfig() {
  var cfg = window.VHFINFO_SUPABASE || {};
  return {
    url: (cfg.url || "").trim(),
    anonKey: (cfg.anonKey || "").trim(),
  };
}

function authIsConfigured() {
  var cfg = authConfig();
  return cfg.url.indexOf("https://") === 0 && cfg.anonKey.length > 20;
}

function setAuthMessage(text, isError) {
  var el = document.getElementById("auth-message");
  if (!el) {
    return;
  }
  el.textContent = text || "";
  el.style.display = text ? "block" : "none";
  el.className = isError ? "auth-message auth-error" : "auth-message";
}

function showAuthModal() {
  var modal = document.getElementById("auth-modal");
  modal.style.display = "block";
  setAuthMessage("");
  var sent = document.getElementById("auth-sent");
  var form = document.getElementById("auth-form");
  sent.style.display = "none";
  form.style.display = "block";
  var email = document.getElementById("auth-email");
  if (email) {
    setTimeout(function () {
      email.focus();
    }, 50);
  }
}

function hideAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

function cancelAuthModal() {
  var sent = document.getElementById("auth-sent");
  var waitingForEmail = sent && sent.style.display === "block";
  if (!waitingForEmail) {
    vhfAuth.pendingAfterSignIn = null;
    sessionStorage.removeItem("vhf_pending_edit");
  }
  hideAuthModal();
}

function updateAuthUi() {
  var email = getSignedInEmail();
  var chip = document.getElementById("auth-chip");
  var chipText = document.getElementById("auth-chip-text");
  var publishAs = document.getElementById("publish-as");
  if (chip && chipText) {
    if (email) {
      chip.style.display = "flex";
      chipText.textContent = "Signed in as " + email;
    } else {
      chip.style.display = "none";
    }
  }
  if (publishAs) {
    publishAs.textContent = email
      ? "These changes will be published as " + email + "."
      : "";
  }
}

function setAuthSession(session) {
  vhfAuth.session = session || null;
  updateAuthUi();
}

function initAuth() {
  if (!authIsConfigured() || typeof supabase === "undefined") {
    return Promise.resolve(null);
  }
  if (vhfAuth.client) {
    return vhfAuth.client.auth.getSession().then(function (result) {
      setAuthSession(result.data && result.data.session);
      return vhfAuth.session;
    });
  }
  vhfAuth.client = supabase.createClient(authConfig().url, authConfig().anonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  vhfAuth.client.auth.onAuthStateChange(function (event, session) {
    setAuthSession(session);
    if (session && vhfAuth.pendingAfterSignIn) {
      var next = vhfAuth.pendingAfterSignIn;
      vhfAuth.pendingAfterSignIn = null;
      sessionStorage.removeItem("vhf_pending_edit");
      hideAuthModal();
      next();
    }
    var pending = sessionStorage.getItem("vhf_pending_edit");
    var returningFromAuth =
      window.location.search.indexOf("code=") >= 0 ||
      window.location.hash.indexOf("access_token") >= 0;
    if (session && pending && returningFromAuth) {
      sessionStorage.removeItem("vhf_pending_edit");
      hideAuthModal();
      if (typeof requestEnterEditMode === "function") {
        requestEnterEditMode(pending === "1" ? undefined : pending);
      }
    }
  });
  return vhfAuth.client.auth.getSession().then(function (result) {
    setAuthSession(result.data && result.data.session);
    if (window.location.search.indexOf("code=") >= 0) {
      var clean = window.location.pathname + (window.location.hash || "");
      window.history.replaceState({}, document.title, clean);
    }
    return vhfAuth.session;
  });
}

function requireSignIn(next, pendingToken) {
  if (isSignedIn()) {
    next();
    return;
  }
  vhfAuth.pendingAfterSignIn = next;
  sessionStorage.setItem("vhf_pending_edit", pendingToken || "1");
  showAuthModal();
  if (!authIsConfigured()) {
    setAuthMessage(
      "Sign-in is not connected yet. The site owner still needs to finish the free signup setup.",
      true,
    );
  }
}

function sendMagicLink() {
  var emailInput = document.getElementById("auth-email");
  var email = (emailInput && emailInput.value ? emailInput.value : "").trim();
  if (!email || email.indexOf("@") < 0) {
    setAuthMessage("Please enter the email address you use.", true);
    return;
  }
  if (!authIsConfigured() || !vhfAuth.client) {
    setAuthMessage(
      "Sign-in is not connected yet. The site owner still needs to finish the free signup setup.",
      true,
    );
    return;
  }
  setAuthMessage("Sending the link…");
  vhfAuth.client.auth
    .signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: authRedirectTo(),
        shouldCreateUser: true,
      },
    })
    .then(function (result) {
      if (result.error) {
        setAuthMessage(
          "Could not send the link. Check the address and try again.",
          true,
        );
        console.error(result.error);
        return;
      }
      document.getElementById("auth-form").style.display = "none";
      document.getElementById("auth-sent").style.display = "block";
      document.getElementById("auth-sent-email").textContent = email;
      setAuthMessage("");
    })
    .catch(function (err) {
      console.error(err);
      setAuthMessage(
        "Could not send the link. Check the address and try again.",
        true,
      );
    });
}

function signInWithGoogle() {
  if (!authIsConfigured() || !vhfAuth.client) {
    setAuthMessage(
      "Google sign-in is not available yet. Use the email link instead.",
      true,
    );
    return;
  }
  sessionStorage.setItem("vhf_pending_edit", "1");
  vhfAuth.client.auth
    .signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectTo(),
      },
    })
    .then(function (result) {
      if (result.error) {
        setAuthMessage(
          "Google sign-in is not available yet. Use the email link instead.",
          true,
        );
        console.error(result.error);
      }
    })
    .catch(function (err) {
      console.error(err);
      setAuthMessage(
        "Google sign-in is not available yet. Use the email link instead.",
        true,
      );
    });
}

function signOut() {
  var done = function () {
    setAuthSession(null);
    if (typeof editMode !== "undefined" && editMode && typeof requestExitEditMode === "function") {
      changedIds = {};
      requestExitEditMode();
    }
  };
  if (!vhfAuth.client) {
    done();
    return;
  }
  vhfAuth.client.auth.signOut().then(done).catch(done);
}

function resetAuthForm() {
  document.getElementById("auth-form").style.display = "block";
  document.getElementById("auth-sent").style.display = "none";
  setAuthMessage("");
  var email = document.getElementById("auth-email");
  if (email) {
    email.focus();
  }
}
