/* global supabase, m, mapPosition, countryToEdit, requestEnterEditMode, editMode, requestExitEditMode, changedIds, loadCountryOnCoordiate */

var vhfAuth = {
  client: null,
  session: null,
  pendingAfterSignIn: null,
  didResumeEdit: false,
};

var vhfHadAuthCallback =
  window.location.search.indexOf("code=") >= 0 ||
  window.location.hash.indexOf("access_token") >= 0;

function authRedirectTo() {
  // Keep this as the path only. Query strings are not in the Supabase allow list;
  // map position is restored from localStorage after sign-in.
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
    clearAuthIntent();
  }
  hideAuthModal();
}

function currentMapPosString() {
  if (typeof m !== "undefined" && m && m.getCenter) {
    try {
      var c = m.getCenter();
      return (
        c.lat.toFixed(6) + "/" + c.lng.toFixed(6) + "/" + m.getZoom()
      );
    } catch (err) {}
  }
  if (typeof mapPosition === "string" && mapPosition) {
    return decodeURIComponent(mapPosition);
  }
  return "";
}

function rememberAuthIntent(pendingToken) {
  var countryCode = pendingToken;
  if (!countryCode || countryCode === "1") {
    countryCode =
      typeof countryToEdit === "function" ? countryToEdit() || "1" : "1";
  }
  try {
    // localStorage: the email link opens a new tab, which has empty sessionStorage.
    localStorage.setItem("vhf_enter_edit", "1");
    localStorage.setItem("vhf_pending_edit", countryCode);
    localStorage.setItem("vhf_pending_at", String(Date.now()));
    var pos = currentMapPosString();
    if (pos) {
      localStorage.setItem("vhf_pending_map", pos);
    }
  } catch (err) {}
}

function clearAuthIntent() {
  try {
    localStorage.removeItem("vhf_enter_edit");
    localStorage.removeItem("vhf_pending_edit");
    localStorage.removeItem("vhf_pending_map");
    localStorage.removeItem("vhf_pending_at");
  } catch (err) {}
}

function peekAuthIntent() {
  var pending = null;
  var pos = null;
  var at = null;
  try {
    pending = localStorage.getItem("vhf_pending_edit");
    pos = localStorage.getItem("vhf_pending_map");
    at = localStorage.getItem("vhf_pending_at");
  } catch (err) {
    return null;
  }
  if (!pending) {
    return null;
  }
  if (at && Date.now() - parseInt(at, 10) > 2 * 60 * 60 * 1000) {
    clearAuthIntent();
    return null;
  }
  return {
    country: pending && pending !== "1" ? pending : null,
    mapPos: pos,
  };
}

function consumeAuthIntent() {
  var intent = peekAuthIntent();
  if (intent) {
    clearAuthIntent();
  }
  return intent;
}

function applyStoredMap(mapPos) {
  if (!mapPos || typeof m === "undefined" || !m) {
    return;
  }
  var parts = mapPos.split("/");
  if (parts.length < 2) {
    return;
  }
  var lat = parseFloat(parts[0]);
  var lon = parseFloat(parts[1]);
  var zoom = parseInt(parts[2] || "11", 10);
  if (isNaN(lat) || isNaN(lon)) {
    return;
  }
  m.setView([lat, lon], isNaN(zoom) ? 11 : zoom);
  if (typeof loadCountryOnCoordiate === "function") {
    loadCountryOnCoordiate([lat, lon]);
  }
}

function resumePendingEdit() {
  if (vhfAuth.didResumeEdit) {
    return false;
  }
  if (!isSignedIn() || typeof requestEnterEditMode !== "function") {
    return false;
  }
  var intent = peekAuthIntent();
  if (!intent) {
    return false;
  }
  vhfAuth.didResumeEdit = true;
  hideAuthModal();
  applyStoredMap(intent.mapPos);
  var delay = intent.country ? 150 : 900;
  setTimeout(function () {
    requestEnterEditMode(intent.country || undefined, { silent: true });
    if (typeof editMode !== "undefined" && editMode) {
      clearAuthIntent();
    } else {
      vhfAuth.didResumeEdit = false;
    }
  }, delay);
  return true;
}

function updateAuthUi() {
  var email = getSignedInEmail();
  var chip = document.getElementById("auth-chip");
  var chipText = document.getElementById("auth-chip-text");
  var publishAs = document.getElementById("publish-as");
  if (chip && chipText) {
    if (email) {
      chip.style.display = "flex";
      chipText.textContent = email
        ? "Signed in as " +
          email +
          (typeof editMode !== "undefined" && editMode
            ? ""
            : " — tap the pencil to edit")
        : "";
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
      clearAuthIntent();
      hideAuthModal();
      next();
      return;
    }
    if (session) {
      resumePendingEdit();
    }
  });
  return vhfAuth.client.auth.getSession().then(function (result) {
    setAuthSession(result.data && result.data.session);
    if (window.location.search.indexOf("code=") >= 0) {
      var clean =
        window.location.pathname +
        (window.location.hash || "");
      window.history.replaceState({}, document.title, clean);
    }
    return fetchAuthProviderSettings().then(function () {
      return vhfAuth.session;
    });
  });
}

function fetchAuthProviderSettings() {
  var cfg = authConfig();
  return fetch(cfg.url + "/auth/v1/settings", {
    headers: {
      apikey: cfg.anonKey,
      Authorization: "Bearer " + cfg.anonKey,
    },
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (settings) {
      var googleOn = !!(settings.external && settings.external.google);
      var googleBtn = document.getElementById("auth-google");
      var orEl = document.querySelector("#auth-modal .auth-or");
      if (googleBtn) {
        googleBtn.style.display = googleOn ? "" : "none";
      }
      if (orEl) {
        orEl.style.display = googleOn ? "" : "none";
      }
    })
    .catch(function () {});
}

function requireSignIn(next, pendingToken) {
  if (isSignedIn()) {
    next();
    return;
  }
  vhfAuth.pendingAfterSignIn = next;
  rememberAuthIntent(pendingToken);
  showAuthModal();
  if (!authIsConfigured()) {
    setAuthMessage(
      "Sign-in is not connected yet. The site owner still needs to finish the free signup setup.",
      true,
    );
  }
}

function authErrorMessage(err) {
  var code = (err && (err.code || err.error_code)) || "";
  var msg = (err && (err.message || err.msg)) || "";
  var combined = (code + " " + msg).toLowerCase();
  if (combined.indexOf("rate") >= 0) {
    return "Too many sign-in emails were sent in a short time. That is a limit on the free mailer. Wait about an hour, or use the browser tab where you are already signed in and tap the pencil.";
  }
  if (combined.indexOf("redirect") >= 0) {
    return "This page address is not yet allowed for sign-in. Add it under Authentication → URL Configuration in Supabase.";
  }
  if (msg) {
    return msg;
  }
  return "Could not send the link. Try again in a little while.";
}
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
        setAuthMessage(authErrorMessage(result.error), true);
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
      setAuthMessage(authErrorMessage(err), true);
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
  rememberAuthIntent();
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
