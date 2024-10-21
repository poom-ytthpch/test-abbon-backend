import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'

import { Injectable } from '@nestjs/common'


@Injectable()
export class ConfigService {
  private static config

  static load() {
    if (this.config) {
      return this.config
    }

    const configPath = path.resolve('config.yaml')
    // console.log({ configPath })

    if (!fs.existsSync(configPath)) {
      if (process.env.NODE_ENV === 'test') {
        return null
      }

      throw new Error('Missing config.yaml!!')
    }

    this.config = yaml.load(fs.readFileSync(configPath, 'utf8'))

    if (process.env.NODE_ENV === 'development') {
      console.log('Config loaded successfully', { config: this.config })
    } else {
      console.log('Config loaded successfully')
    }

    // TODO check process.env
    // this.config = Object.assign(this.config, {
    //   daRegistrar: {
    //     username: process.env.DA_REGISTRAR_USERNAME,
    //     password: process.env.DA_REGISTRAR_USERNAME,
    //     clientId: process.env.DA_REGISTRAR_CLIENT_ID,
    //     clientSecret: process.env.DA_REGISTRAR_CLIENT_SECRET,
    //     ...this.config.daRegistrar,
    //   },
    // })

    return this.config
  }
}