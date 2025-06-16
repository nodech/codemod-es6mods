/*!
 * hd.js - hd keys for hsd
 * Copyright (c) 2017-2018, Christopher Jeffrey (MIT License).
 * https://github.com/handshake-org/hsd
 */

'use strict';

const assert = require('bsert');
const common = require('./common');
const Mnemonic = require('./mnemonic');
const HDPrivateKey = require('./private');
const HDPublicKey = require('./public');
const wordlist = require('./wordlist');

/**
 * Instantiate an HD key (public or private) from an base58 string.
 * @param {Base58String} xkey
 * @param {(Network|NetworkType)?} [network]
 * @returns {HDPrivateKey|HDPublicKey}
 */

export function fromBase58(xkey, network) {
  if (HDPrivateKey.isBase58(xkey))
    return HDPrivateKey.fromBase58(xkey, network);
  return HDPublicKey.fromBase58(xkey, network);
}

/**
 * Generate an {@link HDPrivateKey}.
 * @param {Object} options
 * @param {Buffer?} options.privateKey
 * @param {Buffer?} options.entropy
 * @returns {HDPrivateKey}
 */

export function generate() {
  return HDPrivateKey.generate();
}

/**
 * Generate an {@link HDPrivateKey} from a seed.
 * @param {Object|Mnemonic|Buffer} options - seed,
 * mnemonic, mnemonic options.
 * @returns {HDPrivateKey}
 */

export function fromSeed(options) {
  return HDPrivateKey.fromSeed(options);
}

/**
 * Instantiate an hd private key from a mnemonic.
 * @param {Mnemonic} mnemonic
 * @param {String?} [bip39Passphrase]
 * @returns {HDPrivateKey}
 */

export function fromMnemonic(mnemonic, bip39Passphrase) {
  return HDPrivateKey.fromMnemonic(mnemonic, bip39Passphrase);
}

/**
 * Instantiate an HD key from a jsonified key object.
 * @param {Object} json - The jsonified transaction object.
 * @param {Network?} network
 * @returns {HDPrivateKey|HDPublicKey}
 */

export function fromJSON(json, network) {
  if (json.xprivkey)
    return HDPrivateKey.fromJSON(json, network);
  return HDPublicKey.fromJSON(json, network);
}

/**
 * Instantiate an HD key from serialized data.
 * @param {Buffer} data
 * @param {(Network|NetworkType)?} [network]
 * @returns {HDPrivateKey|HDPublicKey}
 */

export function decode(data, network) {
  if (HDPrivateKey.isRaw(data, network))
    return HDPrivateKey.decode(data, network);
  return HDPublicKey.decode(data, network);
}

/**
 * Generate an hdkey from any number of options.
 * @param {Object|Mnemonic|Buffer} options - mnemonic, mnemonic
 * options, seed, or base58 key.
 * @param {(Network|NetworkType)?} network
 * @returns {HDPrivateKey|HDPublicKey}
 */

export function from(options, network) {
  assert(options, 'Options required.');

  if (isHD(options))
    return options;

  if (isBase58(options, network))
    return fromBase58(options, network);

  if (isRaw(options, network))
    return decode(options, network);

  if (options && typeof options === 'object')
    return fromMnemonic(options);

  throw new Error('Cannot create HD key from bad options.');
}

/**
 * Test whether an object is in the form of a base58 hd key.
 * @param {String} data
 * @param {(Network|NetworkType)?} [network]
 * @returns {Boolean}
 */

export function isBase58(data, network) {
  return HDPrivateKey.isBase58(data, network)
    || HDPublicKey.isBase58(data, network);
}

/**
 * Test whether an object is in the form of a serialized hd key.
 * @param {Buffer} data
 * @param {(Network|NetworkType)?} [network]
 * @returns {Boolean}
 */

export function isRaw(data, network) {
  return HDPrivateKey.isRaw(data, network)
    || HDPublicKey.isRaw(data, network);
}

/**
 * Test whether an object is an HD key.
 * @param {Object} obj
 * @returns {Boolean}
 */

export function isHD(obj) {
  return HDPrivateKey.isHDPrivateKey(obj)
    || HDPublicKey.isHDPublicKey(obj);
}

/**
 * Test whether an object is an HD private key.
 * @param {Object} obj
 * @returns {Boolean}
 */

export function isPrivate(obj) {
  return HDPrivateKey.isHDPrivateKey(obj);
}

/**
 * Test whether an object is an HD public key.
 * @param {Object} obj
 * @returns {Boolean}
 */

export function isPublic(obj) {
  return HDPublicKey.isHDPublicKey(obj);
}

export {
  common,
  Mnemonic,
  HDPrivateKey as PrivateKey,
  HDPublicKey as PublicKey,
  HDPrivateKey,
  HDPublicKey,
  wordlist
};
