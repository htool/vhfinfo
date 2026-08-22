/* Shared VHF feature details — map popup and nearby cards use the same fields. */
(function (root) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortUrlLabel(url) {
    var raw = String(url || "").trim();
    if (!raw) {
      return "";
    }
    var display = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    try {
      var parsed = new URL(raw);
      var host = (parsed.hostname || "").replace(/^www\./i, "");
      var path = parsed.pathname || "";
      if (path === "/") {
        path = "";
      }
      display = host + path;
    } catch (err) {}
    if (display.length > 36) {
      display = display.slice(0, 34) + "\u2026";
    }
    return display;
  }

  function isBlank(value) {
    return value == null || String(value).trim() === "";
  }

  function isPlaceholder(value) {
    var raw = String(value == null ? "" : value).trim();
    return raw === "" || raw === "+" || raw === "https://" || raw === "http://";
  }

  function typeLabel(type) {
    var t = String(type || "").toUpperCase();
    if (t === "VTS RADAR SUPPORT") {
      t = "VTS RADAR";
    }
    return t;
  }

  function pickMode(props) {
    var data = (props && props.vhfdata) || {};
    if (data.generic && data.generic.mode) {
      return data.generic.mode;
    }
    if (data.pleasure && data.pleasure.mode) {
      return data.pleasure.mode;
    }
    if (data.cargo && data.cargo.mode) {
      return data.cargo.mode;
    }
    return "";
  }

  function pickUrl(props) {
    var data = (props && props.vhfdata) || {};
    if (!isPlaceholder(props && props.url)) {
      return String(props.url).trim();
    }
    if (data.pleasure && !isPlaceholder(data.pleasure.url)) {
      return String(data.pleasure.url).trim();
    }
    if (data.cargo && !isPlaceholder(data.cargo.url)) {
      return String(data.cargo.url).trim();
    }
    return "";
  }

  function pickPhone(props) {
    var data = (props && props.vhfdata) || {};
    if (!isPlaceholder(props && props.phone)) {
      return String(props.phone).trim();
    }
    if (data.pleasure && !isPlaceholder(data.pleasure.phone)) {
      return String(data.pleasure.phone).trim();
    }
    if (data.generic && !isPlaceholder(data.generic.phone)) {
      return String(data.generic.phone).trim();
    }
    if (data.emergency && !isPlaceholder(data.emergency.phone)) {
      return String(data.emergency.phone).trim();
    }
    return "";
  }

  function formatUpdate(update) {
    var raw = String(update == null ? "" : update).trim();
    if (!raw) {
      return "";
    }
    if (/^https?:\/\//i.test(raw)) {
      return (
        '<a href="' +
        escapeHtml(raw) +
        '" title="' +
        escapeHtml(raw) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(shortUrlLabel(raw)) +
        "</a>"
      );
    }
    try {
      if (typeof cronstrue !== "undefined" && cronstrue.toString) {
        return escapeHtml(cronstrue.toString(raw + " * * *"));
      }
    } catch (err) {}
    return escapeHtml(raw);
  }

  function infoLinkRow(label, url) {
    if (isPlaceholder(url)) {
      return "";
    }
    var href = String(url).trim();
    return (
      "<tr><td>" +
      escapeHtml(label) +
      '</td><td><a href="' +
      escapeHtml(href) +
      '" title="' +
      escapeHtml(href) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(shortUrlLabel(href)) +
      "</a></td></tr>"
    );
  }

  function phoneRow(phone) {
    if (isPlaceholder(phone)) {
      return "";
    }
    var value = String(phone).trim();
    return (
      '<tr><td>Phone</td><td><a href="tel:' +
      escapeHtml(value) +
      '">' +
      escapeHtml(value) +
      "</a></td></tr>"
    );
  }

  /* Notes are inserted as HTML, matching the map popup. */
  function noteRow(note) {
    if (isBlank(note)) {
      return "";
    }
    return '<tr><td>Note</td><td class="feature-note">' + note + "</td></tr>";
  }

  function sectionRows(title, json, skipUrl, skipPhone) {
    if (!json || typeof json !== "object") {
      return "";
    }
    var h = "";
    h += noteRow(json.note);
    if (!skipPhone) {
      h += phoneRow(json.phone);
    }
    if (!skipUrl) {
      h += infoLinkRow("Info", json.url);
    }
    if (!h) {
      return "";
    }
    return (
      '<tr><td colspan="2"><b>' + escapeHtml(title) + "</b></td></tr>" + h
    );
  }

  function buildInfoTable(props, options) {
    var p = props || {};
    var opts = options || {};
    var data = p.vhfdata || {};
    var type = typeLabel(p.type);
    var name = p.name || "";
    var mode = pickMode(p);
    var channel = p.channel == null ? "" : String(p.channel);
    var topUrl = pickUrl(p);
    var topPhone = pickPhone(p);

    var html =
      '<table class="feature-info"><tbody><tr><td colspan="2"><b>[' +
      escapeHtml(type) +
      "] " +
      escapeHtml(name) +
      "</b></td></tr>";

    if (!isBlank(p.callname)) {
      html +=
        "<tr><td>Call&nbsp;sign</td><td>" +
        escapeHtml(p.callname) +
        "</td></tr>";
    }

    html += "<tr><td>VHF</td><td>" + escapeHtml(channel);
    if (mode) {
      html += " (" + escapeHtml(mode) + ")";
    }
    html += "</td></tr>";

    html += infoLinkRow("Info", topUrl);
    html += phoneRow(topPhone);

    if (!isBlank(p.update)) {
      html +=
        "<tr><td>Update schedule</td><td>" +
        formatUpdate(p.update) +
        "</td></tr>";
    }

    html += noteRow(p.note);

    function skipDupUrl(block) {
      return !!(block && !isPlaceholder(block.url) && block.url === topUrl);
    }
    function skipDupPhone(block) {
      return !!(
        block &&
        !isPlaceholder(block.phone) &&
        block.phone === topPhone
      );
    }

    html += sectionRows(
      "Generic",
      data.generic,
      skipDupUrl(data.generic),
      skipDupPhone(data.generic),
    );
    html += sectionRows(
      "Pleasure",
      data.pleasure,
      skipDupUrl(data.pleasure),
      skipDupPhone(data.pleasure),
    );
    html += sectionRows(
      "Cargo",
      data.cargo,
      skipDupUrl(data.cargo),
      skipDupPhone(data.cargo),
    );
    html += sectionRows(
      "Emergency",
      data.emergency,
      skipDupUrl(data.emergency),
      skipDupPhone(data.emergency),
    );

    if (opts.editLink) {
      html += opts.editLink;
    }
    html += "</tbody></table>";
    return html;
  }

  root.vhfFeatureInfo = {
    escapeHtml: escapeHtml,
    shortUrlLabel: shortUrlLabel,
    formatUpdate: formatUpdate,
    typeLabel: typeLabel,
    pickMode: pickMode,
    pickUrl: pickUrl,
    pickPhone: pickPhone,
    isPlaceholder: isPlaceholder,
    buildInfoTable: buildInfoTable,
  };
})(typeof window !== "undefined" ? window : this);
