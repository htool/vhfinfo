/* global vhfAuth, getSignedInUser */
/**
 * Dual-write helper: map publishes still go to commit.vhfinfo.org;
 * this also upserts/deletes the same features in public.vhf_features.
 * Edit mode reads this table. The public map still reads GitHub.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.vhfFeaturesDb = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  function publicConfig(options) {
    options = options || {};
    if (options.url && options.anonKey) {
      return { url: options.url, anonKey: options.anonKey };
    }
    if (typeof window !== "undefined" && window.VHFINFO_SUPABASE) {
      return window.VHFINFO_SUPABASE;
    }
    return { url: "", anonKey: "" };
  }

  function channelToText(value) {
    if (value == null || value === "") {
      return null;
    }
    return String(value);
  }

  function featureToRow(country, uuid, info, userId) {
    var feature = info && info.feature;
    var props = (feature && feature.properties) || {};
    var geometry = feature && feature.geometry;
    if (!props.id) {
      props.id = uuid;
    }
    var row = {
      id: uuid,
      country: country,
      name: props.name == null ? (info && info.name) || null : String(props.name),
      type: props.type == null ? (info && info.type) || null : String(props.type),
      channel: channelToText(props.channel),
      properties: props,
      geometry: geometry,
      updated_by: userId || null,
    };
    if (info && info.action === "Add" && userId) {
      row.created_by = userId;
    }
    return row;
  }

  function changesToDbOps(country, changesObj, userId) {
    var upserts = [];
    var deletes = [];
    var skipped = [];
    Object.keys(changesObj || {}).forEach(function (uuid) {
      var info = changesObj[uuid];
      if (!info) {
        return;
      }
      if (info.action === "Delete") {
        deletes.push(uuid);
        return;
      }
      if (!info.feature || !info.feature.geometry) {
        skipped.push(uuid);
        return;
      }
      upserts.push(featureToRow(country, uuid, info, userId));
    });
    return { upserts: upserts, deletes: deletes, skipped: skipped };
  }

  function publishFeaturesToDb(country, changesObj, options) {
    options = options || {};
    var client =
      options.client ||
      (typeof vhfAuth !== "undefined" && vhfAuth.client) ||
      null;
    var user =
      options.user ||
      (typeof getSignedInUser === "function" ? getSignedInUser() : null);
    if (!client || !user) {
      return Promise.resolve({ skipped: true, reason: "not-signed-in" });
    }
    var ops = changesToDbOps(country, changesObj, user.id);
    if (!ops.upserts.length && !ops.deletes.length) {
      return Promise.resolve({ ok: true, empty: true, skipped: ops.skipped });
    }
    var chain = Promise.resolve();
    if (ops.upserts.length) {
      chain = chain.then(function () {
        return client.from("vhf_features").upsert(ops.upserts, {
          onConflict: "id",
        });
      }).then(function (res) {
        if (res && res.error) {
          throw res.error;
        }
      });
    }
    if (ops.deletes.length) {
      chain = chain.then(function () {
        return client.from("vhf_features").delete().in("id", ops.deletes);
      }).then(function (res) {
        if (res && res.error) {
          throw res.error;
        }
      });
    }
    return chain
      .then(function () {
        return { ok: true, upserts: ops.upserts.length, deletes: ops.deletes.length };
      })
      .catch(function (err) {
        console.error(err);
        return {
          error: (err && (err.message || err.error_description)) || String(err),
        };
      });
  }

  function rowsToFeatures(rows) {
    return (rows || [])
      .filter(function (row) {
        return row && row.geometry && row.geometry.type;
      })
      .map(function (row) {
        var props = {};
        if (
          row.properties &&
          typeof row.properties === "object" &&
          !Array.isArray(row.properties)
        ) {
          Object.keys(row.properties).forEach(function (key) {
            props[key] = row.properties[key];
          });
        }
        if (!props.id) {
          props.id = row.id;
        }
        if (props.name == null && row.name != null) {
          props.name = row.name;
        }
        if (props.type == null && row.type != null) {
          props.type = row.type;
        }
        if (props.channel == null && row.channel != null) {
          props.channel = row.channel;
        }
        return {
          type: "Feature",
          properties: props,
          geometry: row.geometry,
        };
      });
  }

  function fetchCountryFeatures(country, options) {
    options = options || {};
    var client =
      options.client ||
      (typeof vhfAuth !== "undefined" && vhfAuth.client) ||
      null;
    if (client && typeof client.from === "function") {
      return client
        .from("vhf_features")
        .select("id,country,name,type,channel,properties,geometry")
        .eq("country", country)
        .limit(1000)
        .then(function (res) {
          if (res && res.error) {
            throw res.error;
          }
          return rowsToFeatures(res && res.data);
        });
    }
    var cfg = publicConfig(options);
    var base = (cfg.url || "").replace(/\/$/, "");
    if (!base || !cfg.anonKey) {
      return Promise.reject(new Error("Supabase is not configured"));
    }
    var url =
      base +
      "/rest/v1/vhf_features?country=eq." +
      encodeURIComponent(country) +
      "&select=id,country,name,type,channel,properties,geometry&limit=1000";
    return fetch(url, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: "Bearer " + cfg.anonKey,
      },
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = text ? JSON.parse(text) : [];
        if (!res.ok) {
          throw new Error(
            (data && (data.message || data.error)) ||
              "Could not load features HTTP " + res.status,
          );
        }
        if (!Array.isArray(data)) {
          throw new Error("Unexpected feature response");
        }
        return rowsToFeatures(data);
      });
    });
  }

  return {
    channelToText: channelToText,
    featureToRow: featureToRow,
    changesToDbOps: changesToDbOps,
    publishFeaturesToDb: publishFeaturesToDb,
    rowsToFeatures: rowsToFeatures,
    fetchCountryFeatures: fetchCountryFeatures,
  };
});
