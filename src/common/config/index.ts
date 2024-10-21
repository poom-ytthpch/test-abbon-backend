export * from './config.module'
export * from './config.service'


export function checkMissingRequiredConfigs(configNames: string[]): string[] {
  try {
    return configNames.filter(configName => !process.env[configName] || process.env[configName] === '')
  } catch (error) {
    throw error
  }
}
