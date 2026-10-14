// src/utils/logger.js
//
// Единая точка логирования на фронте.
// В dev-режиме пишет всё в консоль, в прод-сборке — только ошибки.
// Использование: import logger from '../utils/logger'
//                logger.error('что-то сломалось', err)

const isDev = import.meta.env.DEV

const noop = () => {}

const logger = {
    debug: isDev ? (...args) => console.debug(...args) : noop,
    info: isDev ? (...args) => console.info(...args) : noop,
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
}

export default logger
