"use strict";

const APP_ORIGIN = "https://app.sowt.ai";
const WEBSITE_ORIGIN = "https://sowt.ai";
function parsed(raw) {try {return new URL(raw);} catch {return null;}}
function isAppUrl(raw) {
  const u = parsed(raw);
  return !!u && u.origin === APP_ORIGIN && !u.username && !u.password;
}
function isExternalUrl(raw) {
  const u = parsed(raw);
  return !!u && u.protocol === "https:" && !u.username && !u.password;
}
function mayUseMicrophone({origin, mainFrame, mediaTypes}) {
  return isAppUrl(origin) && mainFrame === true && Array.isArray(mediaTypes) && mediaTypes.length > 0 && mediaTypes.every(type => type === "audio");
}
module.exports = {APP_ORIGIN, WEBSITE_ORIGIN, isAppUrl, isExternalUrl, mayUseMicrophone};
