'use babel'
/* global atom, snapshotResult */

import cosmiconfig from 'cosmiconfig'
import { dirname } from 'path'

import pkgName, { atomPkgName } from './pkgName'
import { isValidConfig, normalizeConfig } from './parseConfig'

const debug = require('debug')(`${pkgName}:getConfig`)
let cache = new Map()
let explorer

const configName = 'on-save'
const createExplorer = useCache => {
  explorer = cosmiconfig(configName, {
    searchPlaces: ['package.json', `.${configName.replace(/-/g, '')}rc`, `${configName}.config.js`],
    packageProp: configName,
    cache: useCache,
  })
}

const getConfig = (savedPath, useCache) => {
  if (!explorer) createExplorer(useCache)
  debug('Getting config', savedPath)
  let { config, filepath: configPath } = loadConfig(savedPath) || {}
  if (useCache && cache.has(configPath)) {
    debug('Resolving config for `%s` from cache', configPath)
    return cache.get(configPath)
  }
  if (!config || !configPath || !isValidConfig(config)) return {}
  const result = {
    config: normalizeConfig(config),
    configDir: dirname(configPath),
  }
  if (useCache) cache.set(configPath, result)
  return result
}

const loadConfig = savedPath => {
  debug('Loading config', savedPath)
  if (!savedPath) return
  try {
    return explorer.searchSync(dirname(savedPath))
  } catch (err) {
    atom.notifications.addError('Could not parse configuration file', {
      detail: err.message,
    })
  }
}

export const clearCache = () => {
  debug('Clearing config cache')
  cache = new Map()
  explorer = undefined
}

export default getConfig
