/*!
 * common.js - chain constants for hsd
 * Copyright (c) 2017-2018, Christopher Jeffrey (MIT License).
 * https://github.com/handshake-org/hsd
 */

'use strict';

/** @typedef {import('@handshake-org/bfilter').BloomFilter} BloomFilter */
/** @typedef {import('../types').LockFlags} LockFlags */

/**
 * @module blockchain/common
 */

/**
 * Locktime flags.
 * @enum {Number}
 */

export const lockFlags = {};

/**
 * Consensus locktime flags (used for block validation).
 * @const {LockFlags}
 * @default
 */

export const MANDATORY_LOCKTIME_FLAGS = 0;

/**
 * Standard locktime flags (used for mempool validation).
 * @const {LockFlags}
 * @default
 */

export const STANDARD_LOCKTIME_FLAGS = 0
  | MANDATORY_LOCKTIME_FLAGS;

/**
 * Threshold states for versionbits
 * @enum {Number}
 * @default
 */

export const thresholdStates = {
  DEFINED: 0,
  STARTED: 1,
  LOCKED_IN: 2,
  ACTIVE: 3,
  FAILED: 4
};

/**
 * Verify flags for blocks.
 * @enum {Number}
 * @default
 */

export const flags = {
  VERIFY_NONE: 0,
  VERIFY_POW: 1 << 0,
  VERIFY_BODY: 1 << 1
};

/**
 * Default block verify flags.
 * @const {Number}
 * @default
 */

export const DEFAULT_FLAGS = 0
  | flags.VERIFY_POW
  | flags.VERIFY_BODY;

/**
 * Interactive scan actions.
 * @enum {Number}
 * @default
 */

export const scanActions = {
  NONE: 0,
  ABORT: 1,
  NEXT: 2,
  REPEAT_SET: 3,
  REPEAT_ADD: 4,
  REPEAT: 5
};

/**
 * @typedef {Object} ActionAbort
 * @property {exports.scanActions} type - ABORT
 */

/**
 * @typedef {Object} ActionNext
 * @property {exports.scanActions} type - NEXT
 */

/**
 * @typedef {Object} ActionRepeat
 * @property {exports.ScanAction} type - REPEAT
 */

/**
 * @typedef {Object} ActionRepeatAdd
 * @property {exports.scanActions} type - REPEAT_ADD
 * @property {Buffer[]} chunks
 */

/**
 * @typedef {Object} ActionRepeatSet
 * @property {exports.scanActions} type - REPEAT_SET
 * @property {BloomFilter} filter
 */

/**
 * @typedef {ActionAbort
 *  | ActionNext
 *  | ActionRepeat
 *  | ActionRepeatAdd
 *  | ActionRepeatSet
 * } ScanAction
 */

