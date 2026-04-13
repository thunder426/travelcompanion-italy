/**
 * Simple singleton that holds the user's currently selected destination.
 * Used to enrich Claude API prompts with location context.
 */

let _current = null; // { id, name, region, tagline }

export function setCurrentDestination(destination) {
  _current = destination
    ? { id: destination.id, name: destination.name, region: destination.region, tagline: destination.tagline }
    : null;
}

export function getCurrentDestination() {
  return _current;
}

export function getContextString() {
  if (!_current) return '';
  return `The visitor is currently in ${_current.name}, ${_current.region}, Italy (${_current.tagline}).`;
}
