/* global vhfAuth, getSignedInUser */
/**
 * Dual-write helper: map publishes still go to commit.vhfinfo.org;
 * this also upserts/deletes the same features in public.vhf_features.
 * The public map still reads GitHub.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.vhfFeaturesDb = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
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

  return {
    channelToText: channelToText,
    featureToRow: featureToRow,
    changesToDbOps: changesToDbOps,
    publishFeaturesToDb: publishFeaturesToDb,
  };
});
